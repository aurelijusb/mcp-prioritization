# MCP Prioritization

A "human prioritization" MCP server built with the official MCP TypeScript SDK
**v2** (`@modelcontextprotocol/server@^2.0.0`) and the **MCP Apps** extension:
the `human_prioritization` tool ships an interactive `ui://` drag-and-drop
list that hosts like Claude Cowork render as a sandboxed iframe. Reorder the
items, press **"Send priorities to chat"**, and the ranked list comes back
into the conversation as `Prioritized: 1. ... 2. ...`.

## Try the deployed server

A live instance runs at **<https://mcp-prioritization.netlify.app/mcp>** —
add it to Claude as a custom connector (**Customize → Connectors → Add →
Add custom connector → Remote MCP server URL**; details in
[docs/claude.md](docs/claude.md)).

![Usage of the HTTP version of the MCP app: the human_prioritization tool renders a drag-and-drop list in the Claude chat](docs/claude/http-mcp-app.gif)

Example queries to force the MCP tool to be picked up:

```
List top 10 biggest cities in Lithuania
Let me prioritize cities to visit
```

> Requires at least a **Sonnet**-tier model — Haiku did not call the tool in
> testing.

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
- [ChatGPT](docs/chatgpt.md) — adding the deployed server as a ChatGPT plugin
- [Netlify](docs/netlify.md) — `/mcp` endpoint, first-time project creation,
  GitHub Actions
