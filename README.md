# Motion

My code-driven playground for animation, video, motion graphics, and procedural art. It holds experiments, visual studies, reusable tools, and finished pieces.

## Explore

- `src/scenes/` — animations and compositions
- `references/` — visual references and studies
- `docs/` — process notes and workflows

## Handwriting clips

Type and tune handwritten text in the playground [Handwriting tool](https://play.tonyzeb.com/tools/handwriting), export its settings, then render a transparent ProRes 4444 `.mov` for DaVinci Resolve:

```bash
npm run handwriting -- ~/Downloads/handwriting-your-text.json
```

See [docs/handwriting.md](./docs/handwriting.md).
- `.agents/skills/` — creative and technical guides

## Run

The current video compositions use Remotion:

```bash
npm install
npm run dev
```

See [AGENTS.md](./AGENTS.md) for project conventions and agent workflows.
