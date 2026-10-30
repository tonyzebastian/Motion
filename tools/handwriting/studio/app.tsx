// Handwriting Studio page (served by server.mjs). Left: a live preview of
// the exact clip that will be rendered, with the text box under it. Right:
// every setting, the save folder, and Create.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import {
  HANDWRITING_CLIP_DEFAULTS,
  HandwritingClip,
  handwritingClipFrames,
  type HandwritingClipProps,
} from "../../../src/scenes/JunyStudios/shared/handwriting/HandwritingClip";
import { HAND_FONTS } from "../../../src/scenes/JunyStudios/shared/handwriting/HandWrite";

type Settings = HandwritingClipProps;
type Look = { name: string; settings: Partial<Settings> };

const FONT_LABELS: Record<string, string> = {
  reenieBeanie: "Reenie Beanie",
  sacramento: "Sacramento",
  homemadeApple: "Homemade Apple",
  mrsSaintDelafield: "Mrs Saint Delafield",
  allure: "EMS Allure (single line)",
  felix: "EMS Felix (single line)",
};

const RESOLUTIONS = [
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
  [1080, 1920],
  [1080, 1080],
];
const RATES = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];

const api = async (path: string, body?: unknown) => {
  const res = await fetch(path, body === undefined ? undefined : { method: "POST", body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
};

// The format Resolve passes in (?w=1920&h=1080&fps=23.976), if any.
const fromResolve = (() => {
  const q = new URLSearchParams(location.search);
  const w = Number(q.get("w"));
  const h = Number(q.get("h"));
  const fps = Number(q.get("fps"));
  return w && h && fps ? { width: w, height: h, fps } : null;
})();

// ─── Controls ───────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="row" title={hint}>
    <span className="label">{label}</span>
    <span className="control">{children}</span>
  </label>
);

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}> = ({ label, value, min, max, step, onChange, hint }) => (
  <Row label={label} hint={hint}>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    <input
      className="num"
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => e.target.value !== "" && onChange(Number(e.target.value))}
    />
  </Row>
);

const Select: React.FC<{
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <Row label={label}>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  </Row>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2>{title}</h2>
    {children}
  </section>
);

// ─── App ────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [looks, setLooks] = useState<Look[]>([]);
  const [lookName, setLookName] = useState("");
  const [outputDir, setOutputDir] = useState("~/Movies/Handwriting");
  const [backdrop, setBackdrop] = useState<"dark" | "light" | "checker">("dark");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "done" | "error"; text: string; path?: string }>({
    kind: "idle",
    text: "",
  });

  // Load the last settings (or the defaults), looks and save folder.
  useEffect(() => {
    (async () => {
      const [state, list] = await Promise.all([api("/api/state"), api("/api/looks")]);
      setLooks(list);
      setOutputDir(state.outputDir);
      const base = { ...HANDWRITING_CLIP_DEFAULTS, ...(state.studio ?? list[0]?.settings ?? {}) } as Settings;
      if (!state.studio && list[0]) {
        base.text = HANDWRITING_CLIP_DEFAULTS.text;
        setLookName(list[0].name);
      }
      setSettings({ ...base, ...(fromResolve ?? {}) });
    })().catch((e) => setStatus({ kind: "error", text: String(e) }));
  }, []);

  // Remember settings as they change, so the window reopens where you left it.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!settings) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => api("/api/remember", { settings }).catch(() => {}), 600);
  }, [settings]);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }, []);

  const frames = useMemo(() => (settings ? handwritingClipFrames(settings) : 1), [settings]);

  if (!settings) return <div className="loading">{status.text || "Loading…"}</div>;

  const applyLook = (name: string) => {
    const look = looks.find((l) => l.name === name);
    if (!look) return;
    setLookName(name);
    // A look sets the style; keep your text and the output format.
    setSettings((s) =>
      s ? { ...s, ...look.settings, text: s.text, width: s.width, height: s.height, fps: s.fps, instructions: undefined } : s,
    );
  };

  const saveLook = async () => {
    const name = prompt("Name this look:", lookName || "My look");
    if (!name) return;
    try {
      setLooks(await api("/api/looks", { name, settings }));
      setLookName(name.replace(/[/\\:]/g, "-").trim());
    } catch (e) {
      setStatus({ kind: "error", text: String(e) });
    }
  };

  const chooseFolder = async () => {
    const r = await api("/api/choose-folder", {});
    if (r.outputDir) setOutputDir(r.outputDir);
  };

  const create = async () => {
    if (!settings.text.trim()) return setStatus({ kind: "error", text: "Write some text first." });
    setStatus({ kind: "busy", text: "Rendering…" });
    try {
      const r = await api("/api/render", { settings });
      setStatus({ kind: "done", text: r.display, path: r.path });
    } catch (e) {
      setStatus({ kind: "error", text: String((e as Error).message ?? e) });
    }
  };

  const fmt = `${settings.width}×${settings.height}`;

  return (
    <div className="app">
      <main className="left">
        <div className={`stage ${backdrop}`} style={{ aspectRatio: `${settings.width} / ${settings.height}` }}>
          <Player
            component={HandwritingClip}
            inputProps={settings}
            durationInFrames={frames}
            fps={settings.fps}
            compositionWidth={settings.width}
            compositionHeight={settings.height}
            style={{ width: "100%", height: "100%" }}
            controls
            loop
            autoPlay
            acknowledgeRemotionLicense
          />
        </div>
        <div className="under">
          <span>
            {fmt} · {settings.fps} fps · {(frames / settings.fps).toFixed(1)} s
          </span>
          <span className="backdrops">
            Preview on
            {(["dark", "light", "checker"] as const).map((b) => (
              <button key={b} className={backdrop === b ? "on" : ""} onClick={() => setBackdrop(b)}>
                {b === "checker" ? "transparent" : b}
              </button>
            ))}
          </span>
        </div>
        <textarea
          value={settings.text}
          onChange={(e) => set("text", e.target.value)}
          placeholder="Write here. Each line becomes a line of handwriting."
          rows={4}
          autoFocus
        />
      </main>

      <aside className="right">
        <div className="scroll">
          <Section title="Look">
            <Row label="Look">
              <select value={lookName} onChange={(e) => applyLook(e.target.value)}>
                <option value="" disabled>
                  Choose a look…
                </option>
                {looks.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button onClick={saveLook}>Save as…</button>
            </Row>
          </Section>

          <Section title="Type">
            <Select
              label="Font"
              value={settings.font}
              options={Object.keys(HAND_FONTS).map((k) => [k, FONT_LABELS[k] ?? k])}
              onChange={(v) => set("font", v)}
            />
            <Slider label="Size" value={settings.size} min={40} max={400} step={1} onChange={(v) => set("size", v)} />
            <Slider
              label="Weight"
              hint="0 uses the font's own pen width"
              value={settings.weight}
              min={0}
              max={0.2}
              step={0.005}
              onChange={(v) => set("weight", v)}
            />
            <Slider label="Line height" value={settings.lineHeight} min={0.5} max={2} step={0.05} onChange={(v) => set("lineHeight", v)} />
            <Select
              label="Align"
              value={settings.align}
              options={[
                ["left", "Left"],
                ["center", "Centre"],
                ["right", "Right"],
              ]}
              onChange={(v) => set("align", v as Settings["align"])}
            />
            <Select
              label="Position"
              value={settings.position ?? "middle"}
              options={[
                ["top", "Top"],
                ["middle", "Middle"],
                ["lower-third", "Lower third"],
                ["bottom", "Bottom"],
              ]}
              onChange={(v) => set("position", v as Settings["position"])}
            />
          </Section>

          <Section title="Timing">
            <Slider label="Word gap" hint="Frames between words (30 fps)" value={settings.wordGap} min={1} max={30} step={1} onChange={(v) => set("wordGap", v)} />
            <Slider label="Pen speed" value={settings.speed} min={20} max={600} step={5} onChange={(v) => set("speed", v)} />
            <Slider label="Hold" hint="Frames on screen before it leaves (30 fps)" value={settings.hold} min={0} max={300} step={1} onChange={(v) => set("hold", v)} />
            <Select
              label="Exit"
              value={settings.exit}
              options={[
                ["unwrite", "Unwrite"],
                ["dissolve", "Fade out"],
                ["none", "Stay (cut it yourself)"],
              ]}
              onChange={(v) => set("exit", v as Settings["exit"])}
            />
          </Section>

          <Section title="Pen">
            <Slider label="Letter joins" value={settings.connect} min={0} max={1} step={0.05} onChange={(v) => set("connect", v)} />
            <Slider label="Word joins" value={settings.wordConnect} min={0} max={1} step={0.05} onChange={(v) => set("wordConnect", v)} />
            <Slider label="Lead-in" value={settings.lead} min={0} max={3} step={0.05} onChange={(v) => set("lead", v)} />
            <Select
              label="Lead style"
              value={settings.leadStyle}
              options={[
                ["auto", "Auto"],
                ["swoop", "Swoop"],
                ["line", "Line"],
                ["hook", "Hook"],
                ["wave", "Wave"],
              ]}
              onChange={(v) => set("leadStyle", v as Settings["leadStyle"])}
            />
            <Slider label="Tail" value={settings.tail} min={0} max={4} step={0.05} onChange={(v) => set("tail", v)} />
            <Select
              label="Tail style"
              value={settings.tailStyle}
              options={[
                ["auto", "Auto"],
                ["flick", "Flick"],
                ["lift", "Lift"],
                ["drop", "Drop"],
                ["wave", "Wave"],
                ["swash", "Swash"],
              ]}
              onChange={(v) => set("tailStyle", v as Settings["tailStyle"])}
            />
            <Slider label="Variation" hint="Re-rolls the lead-in and tail shapes" value={settings.variation} min={1} max={100} step={1} onChange={(v) => set("variation", v)} />
          </Section>

          <Section title="Wobble">
            <Slider label="Wiggle" value={settings.wiggle} min={0} max={4} step={0.1} onChange={(v) => set("wiggle", v)} />
            <Slider label="Boil" hint="Frames between wobble changes" value={settings.boil} min={1} max={12} step={1} onChange={(v) => set("boil", v)} />
            <Slider label="Texture" value={settings.texture} min={0} max={3} step={0.1} onChange={(v) => set("texture", v)} />
          </Section>

          <Section title="Colour">
            <Row label="Ink">
              <input type="color" value={settings.ink} onChange={(e) => set("ink", e.target.value)} />
              <span className="mono">{settings.ink}</span>
            </Row>
            <Row label="Shadow">
              <input type="checkbox" checked={settings.shadow} onChange={(e) => set("shadow", e.target.checked)} />
            </Row>
          </Section>

          <Section title="Output">
            <Select
              label="Size"
              value={fmt}
              options={RESOLUTIONS.map(([w, h]) => [`${w}×${h}`, `${w}×${h}`])}
              onChange={(v) => {
                const [w, h] = v.split("×").map(Number);
                setSettings((s) => (s ? { ...s, width: w, height: h } : s));
              }}
            />
            <Select
              label="Frame rate"
              value={String(settings.fps)}
              options={RATES.map((r) => [String(r), `${r} fps`])}
              onChange={(v) => set("fps", Number(v))}
            />
            {fromResolve && <p className="note">Size and frame rate come from your Resolve timeline.</p>}
            <Row label="Save to">
              <span className="path" title={outputDir}>
                {outputDir}
              </span>
              <button onClick={chooseFolder}>Choose…</button>
            </Row>
          </Section>
        </div>

        <footer>
          <button className="create" onClick={create} disabled={status.kind === "busy"}>
            {status.kind === "busy" ? "Rendering…" : "Create"}
          </button>
          {status.kind === "done" && (
            <div className="status done">
              Saved <span className="path">{status.text}</span>
              <button onClick={() => api("/api/reveal", { path: status.path })}>Show in Finder</button>
              <p>Drag it from Finder onto a track above your footage in Resolve.</p>
            </div>
          )}
          {status.kind === "error" && <div className="status error">{status.text}</div>}
        </footer>
      </aside>
    </div>
  );
};

const CSS = `
:root { color-scheme: dark; --bg:#141414; --panel:#1c1c1c; --line:#2c2c2c; --text:#e8e6e3; --muted:#9a9792; --accent:#e7c46a; }
* { box-sizing: border-box; }
html, body, #root { margin:0; height:100%; background:var(--bg); color:var(--text); font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Inter", sans-serif; }
.loading { padding: 24px; color: var(--muted); }
.app { display:grid; grid-template-columns: minmax(0,1fr) 380px; height:100%; }
.left { display:flex; flex-direction:column; gap:12px; padding:20px; min-width:0; overflow:auto; }
.stage { width:100%; max-height:calc(100vh - 240px); margin:0 auto; border-radius:10px; overflow:hidden; border:1px solid var(--line); }
.stage.dark { background:#3b3530; }
.stage.light { background:#efe9df; }
.stage.checker { background: repeating-conic-gradient(#2a2a2a 0 25%, #3a3a3a 0 50%) 0 0 / 24px 24px; }
.under { display:flex; justify-content:space-between; align-items:center; color:var(--muted); font-size:12px; }
.backdrops { display:flex; gap:6px; align-items:center; }
.backdrops button { padding:3px 8px; }
.backdrops button.on { border-color: var(--accent); color: var(--accent); }
textarea { width:100%; min-height:96px; resize:vertical; padding:12px 14px; border-radius:10px; border:1px solid var(--line); background:var(--panel); color:var(--text); font-size:16px; line-height:1.5; }
textarea:focus { outline:1px solid var(--accent); }
.right { display:flex; flex-direction:column; border-left:1px solid var(--line); background:var(--panel); min-height:0; }
.scroll { flex:1; overflow:auto; padding:6px 16px 16px; }
section { padding:10px 0; border-bottom:1px solid var(--line); }
h2 { margin:6px 0 8px; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
.row { display:grid; grid-template-columns: 96px minmax(0,1fr); align-items:center; gap:10px; margin:6px 0; }
.label { color:var(--muted); }
.control { display:flex; align-items:center; gap:8px; min-width:0; }
input[type=range] { flex:1; min-width:0; accent-color: var(--accent); }
.num { width:62px; }
input, select, button { font:inherit; color:var(--text); background:#242424; border:1px solid var(--line); border-radius:6px; padding:4px 6px; }
select { flex:1; min-width:0; }
button { cursor:pointer; white-space:nowrap; }
button:hover { border-color:#444; }
.path { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family: ui-monospace, Menlo, monospace; font-size:12px; }
.mono { font-family: ui-monospace, Menlo, monospace; font-size:12px; color:var(--muted); }
.note { margin:4px 0; color:var(--muted); font-size:12px; }
footer { padding:14px 16px 16px; border-top:1px solid var(--line); }
.create { width:100%; padding:10px; font-size:14px; font-weight:600; background:var(--accent); color:#1a1a1a; border:none; border-radius:8px; }
.create:disabled { opacity:.6; cursor:default; }
.status { margin-top:10px; font-size:12px; line-height:1.5; }
.status.done { color:var(--text); }
.status.done .path { display:block; margin:4px 0; }
.status.done p { margin:6px 0 0; color:var(--muted); }
.status.error { color:#ff8a7a; white-space:pre-wrap; }
`;

const style = document.createElement("style");
style.textContent = CSS;
document.head.appendChild(style);
createRoot(document.getElementById("root")!).render(<App />);
