# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## AI / coding agents

This repo is set up for Remotion Agent Skills so Cursor, Claude Code, Codex, and similar agents can use Remotion correctly.

**Prerequisites:** Node.js 20+ (skills CLI needs a modern Node; use `nvm use 24` if needed).

**Install or refresh skills**

```console
npm run skills:add
# later:
npm run skills:update
```

Skills install into `.agents/skills/` only. `.cursor/skills` and `.claude/skills` are symlinks to that folder (`npm run skills:link`). Agent workflow + system prompt: [`AGENTS.md`](./AGENTS.md).

**Recommended local workflow**

1. `npm run dev` — Remotion Studio preview
2. In a separate agent chat, prompt scene changes (agents should load `remotion-best-practices` / `remotion-markup`)
3. For API questions, agents should use `/remotion-docs` (the Remotion MCP is deprecated)

Official guide: [Building with Remotion and AI](https://www.remotion.dev/docs/ai/) · [Agent Skills](https://www.remotion.dev/docs/ai/skills) · [Coding agents](https://www.remotion.dev/docs/ai/coding-agents)

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
