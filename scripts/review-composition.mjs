#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'node_modules', '.bin', 'remotion');
const entry = join(root, 'src', 'index.ts');

function usage() {
  return [
    'Usage: npm run review:composition -- --id <CompositionId> --frames 0,90,180 [--cuts 120,240] [--window 1] [--out path]',
    '',
    'Renders native PNGs, a labelled HTML contact sheet, and a repeatability check.',
    'Pass explicit frame numbers from the composition timeline. A cut includes',
    'the exact frame and neighboring frames; --window controls each side.'
  ].join('\n');
}

function fail(message) {
  throw new Error(message + '\n\n' + usage());
}

function parseList(value, label) {
  if (!value) return [];
  if (!/^\d+(,\d+)*$/.test(value)) fail(label + ' must be comma-separated nonnegative frame numbers.');
  return value.split(',').map(Number);
}

function parseArgs(args) {
  const values = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--help' || key === '-h') {
      process.stdout.write(usage() + '\n');
      process.exit(0);
    }
    if (!['--id', '--frames', '--cuts', '--window', '--out'].includes(key)) fail('Unknown option: ' + key);
    if (i + 1 >= args.length || args[i + 1].startsWith('--')) fail('Missing value for ' + key);
    values[key.slice(2)] = args[++i];
  }
  if (!values.id || !/^[A-Za-z0-9_-]+$/.test(values.id)) fail('--id must be a safe composition ID.');
  const frames = parseList(values.frames, '--frames');
  const cuts = parseList(values.cuts, '--cuts');
  if (frames.length === 0 && cuts.length === 0) fail('Provide --frames or --cuts.');
  const window = values.window === undefined ? 1 : Number(values.window);
  if (!Number.isInteger(window) || window < 0 || window > 30) fail('--window must be an integer from 0 to 30.');
  const out = values.out
    ? (isAbsolute(values.out) ? values.out : resolve(root, values.out))
    : join(root, 'out', 'reviews', values.id);
  return { id: values.id, frames, cuts, window, out };
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function pngSize(bytes) {
  if (bytes.length < 24 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error('Remotion did not produce a valid PNG.');
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function render(id, frame, output) {
  const args = [
    'still', entry, id, output,
    '--frame', String(frame),
    '--image-format', 'png',
    '--overwrite',
    '--bundle-cache',
    '--log', 'error'
  ];
  const result = spawnSync(cli, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error('Remotion still failed for frame ' + frame + ':\n' + (result.stderr || result.stdout));
  }
  if (!existsSync(output)) throw new Error('Remotion reported success without writing ' + output);
  return readFileSync(output);
}

const config = parseArgs(process.argv.slice(2));
if (!existsSync(cli)) throw new Error('Remotion CLI is missing. Run npm install first.');
mkdirSync(config.out, { recursive: true });

const labels = new Map();
function add(frame, label) {
  if (!labels.has(frame)) labels.set(frame, new Set());
  labels.get(frame).add(label);
}
for (const frame of config.frames) add(frame, 'selected');
for (const cut of config.cuts) {
  for (let offset = -config.window; offset <= config.window; offset++) {
    const frame = cut + offset;
    if (frame >= 0) add(frame, offset === 0 ? 'cut ' + cut : 'cut ' + cut + ' (' + (offset > 0 ? '+' : '') + offset + ')');
  }
}

const frameNumbers = [...labels.keys()].sort((a, b) => a - b);
const files = [];
for (const frame of frameNumbers) {
  const name = 'frame-' + String(frame).padStart(6, '0') + '.png';
  const bytes = render(config.id, frame, join(config.out, name));
  files.push({ frame, name, labels: [...labels.get(frame)], ...pngSize(bytes), sha256: sha256(bytes) });
  process.stdout.write('Rendered frame ' + frame + '\n');
}

const first = files[0];
const repeatedName = 'repeat-' + String(first.frame).padStart(6, '0') + '.png';
const repeated = render(config.id, first.frame, join(config.out, repeatedName));
const repeatedHash = sha256(repeated);
const repeatable = first.sha256 === repeatedHash;

const report = {
  composition: config.id,
  selectedFrames: config.frames,
  cuts: config.cuts,
  cutWindow: config.window,
  frames: files,
  repeatability: {
    frame: first.frame,
    first: first.sha256,
    second: repeatedHash,
    identicalPngBytes: repeatable
  }
};
writeFileSync(join(config.out, 'review.json'), JSON.stringify(report, null, 2) + '\n');

const cards = files.map((item) =>
  '<figure><a href="' + item.name + '"><img src="' + item.name + '" alt="Frame ' + item.frame + '"></a>' +
  '<figcaption><strong>Frame ' + item.frame + '</strong><span>' + item.labels.map(escapeHtml).join(' · ') + '</span>' +
  '<small>' + item.width + ' × ' + item.height + '</small></figcaption></figure>'
).join('\n');
const html = [
  '<!doctype html><html lang="en"><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>' + escapeHtml(config.id) + ' review</title>',
  '<style>body{margin:0;padding:32px;background:#eeeae1;color:#252525;font:14px system-ui,sans-serif}' +
  'h1{font-size:24px;margin:0 0 8px}p{margin:0 0 28px;color:#555}' +
  'main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}' +
  'figure{margin:0;background:white;border:1px solid #ccc;padding:10px}' +
  'img{display:block;width:100%;height:auto}figcaption{display:flex;flex-direction:column;gap:3px;padding:10px 2px 2px}' +
  'small,span{color:#666}a{color:inherit}</style>',
  '<h1>' + escapeHtml(config.id) + ' frame review</h1>',
  '<p>Native PNGs. Open any frame at 1:1 for details. Repeatability: ' + (repeatable ? 'pass' : 'FAIL') + '.</p>',
  '<main>' + cards + '</main></html>'
].join('\n');
writeFileSync(join(config.out, 'contact-sheet.html'), html);
process.stdout.write('Review: ' + join(config.out, 'contact-sheet.html') + '\n');
process.stdout.write('Repeatability: ' + (repeatable ? 'pass' : 'FAIL') + '\n');
if (!repeatable) process.exitCode = 1;
