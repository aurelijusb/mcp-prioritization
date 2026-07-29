# MCP Prioritization

A "human prioritization" MCP server built with the official MCP TypeScript SDK
**v2** (`@modelcontextprotocol/server@^2.0.0`) and the **MCP Apps** extension:
the `human_prioritization` tool ships an interactive `ui://` drag-and-drop
list that hosts like Claude Cowork render as a sandboxed iframe. Reorder the
items, press **"Send priorities to chat"**, and the ranked list comes back
into the conversation as `Prioritized: 1. ... 2. ...`.

## Setup

Requires Node.js 26 (see `.nvmrc`) and uses TypeScript 7 (native compiler).

```bash
nvm use          # picks up .nvmrc
npm install
npm run typecheck   # tsc --noEmit
```

## Quick test

```bash
npx @modelcontextprotocol/inspector --cli npx tsx src/stdio.ts --method tools/list | jq .
```

## Documentation

Full documentation lives in [docs/index.md](docs/index.md)
(Open Knowledge Format bundle):

- [Architecture](docs/architecture.md) — tool, `ui://` view, protocol flow,
  transports
- [Claude](docs/claude.md) — Claude Code / Desktop / Cowork setup and MCP
  Apps support matrix
- [VS Code](docs/vscode.md) — seeing the widget in VS Code's native chat
- [Netlify](docs/netlify.md) — `/mcp` endpoint, first-time project creation,
  GitHub Actions
