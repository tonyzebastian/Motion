import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const sampleRate = 48_000;
const durationSeconds = 30;
const channels = 2;
const frames = sampleRate * durationSeconds;
const output = resolve('public/audio/sundial-launch/score.wav');

let seed = 0x51d1a1;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
};

const chords = [
  [87.31, 130.81, 220.0],
  [98.0, 146.83, 233.08],
  [110.0, 164.81, 261.63],
  [73.42, 110.0, 174.61],
  [58.27, 87.31, 146.83],
  [65.41, 98.0, 164.81],
];

const transitions = [2.25, 4.5, 11.75, 16, 20.25, 24.75];
const melody = [523.25, 659.25, 587.33, 783.99, 698.46, 880.0, 783.99, 1046.5];

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const buffer = Buffer.alloc(44 + frames * channels * 2);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(buffer.length - 8, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(channels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * channels * 2, 28);
buffer.writeUInt16LE(channels * 2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(frames * channels * 2, 40);

let noiseStateL = 0;
let noiseStateR = 0;

for (let i = 0; i < frames; i++) {
  const t = i / sampleRate;
  const chordIndex = Math.min(chords.length - 1, Math.floor(t / 5));
  const chord = chords[chordIndex];
  const chordPhase = (t % 5) / 5;
  const chordEnvelope =
    smoothstep(0, 0.55, t % 5) * (1 - smoothstep(4.25, 5, t % 5));

  let padL = 0;
  let padR = 0;
  for (let n = 0; n < chord.length; n++) {
    const frequency = chord[n];
    const drift = 1 + Math.sin(t * (0.11 + n * 0.035) + n) * 0.0018;
    const phase = Math.PI * 2 * frequency * drift * t;
    const tone =
      Math.sin(phase) * 0.7 +
      Math.sin(phase * 2 + 0.4) * 0.2 +
      Math.sin(phase * 3 + 1.1) * 0.1;
    const pan = (n - 1) * 0.24 + Math.sin(t * 0.17 + n) * 0.06;
    padL += tone * (1 - pan) * 0.5;
    padR += tone * (1 + pan) * 0.5;
  }
  padL *= 0.095 * chordEnvelope * (0.88 + 0.12 * Math.sin(chordPhase * Math.PI));
  padR *= 0.095 * chordEnvelope * (0.88 + 0.12 * Math.sin(chordPhase * Math.PI));

  const beatPosition = t % 1;
  const kickEnvelope = Math.exp(-beatPosition * 15);
  const kickPhase = Math.PI * 2 * (48 + 42 * Math.exp(-beatPosition * 22)) * beatPosition;
  const kick = Math.sin(kickPhase) * kickEnvelope * 0.16;

  const halfBeat = (t + 0.5) % 1;
  const pulseEnvelope = Math.exp(-halfBeat * 8);
  const pulse = Math.sin(Math.PI * 2 * chord[0] * 2 * t) * pulseEnvelope * 0.035;

  const pluckIndex = Math.floor(t / 2);
  const pluckTime = t % 2;
  const pluckEnvelope = Math.exp(-pluckTime * 5.2);
  const pluckFrequency = melody[pluckIndex % melody.length];
  const pluck =
    (Math.sin(Math.PI * 2 * pluckFrequency * t) * 0.75 +
      Math.sin(Math.PI * 4 * pluckFrequency * t) * 0.25) *
    pluckEnvelope *
    0.026;

  const rawNoiseL = random() * 2 - 1;
  const rawNoiseR = random() * 2 - 1;
  noiseStateL += (rawNoiseL - noiseStateL) * 0.09;
  noiseStateR += (rawNoiseR - noiseStateR) * 0.09;
  let transitionWash = 0;
  for (const cut of transitions) {
    const local = t - (cut - 0.55);
    if (local >= 0 && local <= 0.8) {
      const rise = smoothstep(0, 0.55, local);
      const fall = 1 - smoothstep(0.55, 0.8, local);
      transitionWash += rise * fall;
    }
  }
  const airL = noiseStateL * transitionWash * 0.07;
  const airR = noiseStateR * transitionWash * 0.07;

  const master = smoothstep(0, 1.2, t) * (1 - smoothstep(28.2, 30, t));
  const left = Math.tanh((padL + kick + pulse + pluck * 0.8 + airL) * master * 1.35);
  const right = Math.tanh((padR + kick + pulse + pluck + airR) * master * 1.35);

  buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left)) * 32767), 44 + i * 4);
  buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right)) * 32767), 46 + i * 4);
}

mkdirSync(dirname(output), {recursive: true});
writeFileSync(output, buffer);
console.log(output);
