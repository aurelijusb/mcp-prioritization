# Documentation index

Open Knowledge Format (OKF) bundle for the MCP Prioritization project —
an MCP server (TypeScript SDK v2) whose `human_prioritization` tool ships an
interactive MCP Apps drag-and-drop view.

## Concepts

- [Architecture](./architecture.md) — server layout, the tool, the `ui://`
  view, and the MCP Apps protocol flow.
- [Claude](./claude.md) — running the server in Claude Code, Claude Desktop,
  and Claude Cowork; which of them render the MCP Apps UI.
- [VS Code](./vscode.md) — testing the interactive widget in VS Code's
  native chat (`.vscode/mcp.json`).
- [ChatGPT](./chatgpt.md) — adding the HTTP-hosted server as a ChatGPT
  plugin, and the Widget CSP / domain submission warnings.
- [Netlify](./netlify.md) — HTTP transport at `/mcp`, first-time project
  creation, and the GitHub Actions deploy pipeline.
