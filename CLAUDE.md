# MCP Prioritization

MCP server (TypeScript SDK v2, `@modelcontextprotocol/server` — do **not**
use the v1 `@modelcontextprotocol/sdk`) exposing the `human_prioritization`
tool with an MCP Apps `ui://` drag-and-drop view. Transports: stdio
(`src/stdio.ts` — stdout is reserved for JSON-RPC, log to stderr only) and
Netlify Functions (`netlify/functions/mcp.mts`, `/mcp`).

## Documentation

Project documentation is an **Open Knowledge Format (OKF) bundle** rooted at
[docs/index.md](docs/index.md) — consult it (and keep it updated) when
working on:

- [docs/architecture.md](docs/architecture.md) — server layout, tool,
  `ui://` view, MCP Apps protocol flow
- [docs/claude.md](docs/claude.md) — Claude Code / Desktop / Cowork
  integration and MCP Apps support matrix
- [docs/vscode.md](docs/vscode.md) — VS Code native chat integration
- [docs/netlify.md](docs/netlify.md) — deployment and GitHub Actions

## Commands

```bash
npm run typecheck    # tsc --noEmit (TypeScript 7)
npm run stdio        # run the stdio server
npx @modelcontextprotocol/inspector --cli npx tsx src/stdio.ts --method tools/list
```
