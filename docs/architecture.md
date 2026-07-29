---
type: Architecture
title: MCP Prioritization server architecture
description: How the SDK v2 server, the human_prioritization tool, and the MCP Apps ui:// view fit together.
tags: [mcp, mcp-apps, typescript]
status: stable
generated: { by: claude-code/claude-fable-5, at: 2026-07-29T18:30:00Z }
sources:
  - id: mcp-apps-spec
    resource: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
    title: MCP Apps specification (2026-01-26)
---

# MCP Prioritization server architecture

A "human prioritization" MCP server built with the official MCP TypeScript
SDK **v2** (`@modelcontextprotocol/server@^2.0.0`, spec 2026-07-28) and the
**MCP Apps** extension (spec 2026-01-26): the tool ships an interactive
`ui://` HTML view that hosts render as a sandboxed iframe.[^mcp-apps-spec]

## Components

- **Tool `human_prioritization`** (`src/tools.ts`) — input
  `{ items: string[] }`, output `{ items: string[] }`. The tool's
  `_meta.ui.resourceUri` points at the UI resource; hosts without MCP Apps
  support get the fallback text
  `Use MCP apps integration to rearrange elements`.
- **Resource `ui://prioritization/list.html`** (`src/ui.ts`,
  `text/html;profile=mcp-app`) — an ordered list you reorder by **mouse
  drag & drop** or **keyboard** (↑/↓ moves focus, Alt+↑/Alt+↓ or
  Ctrl+↑/Ctrl+↓ moves the item), with a full screen toggle. The
  **"Send priorities to chat"** button posts `Prioritized:` followed by the
  numbered markdown list back into the conversation via the `ui/message`
  request.

The view speaks the MCP Apps postMessage JSON-RPC protocol directly
(`ui/initialize` handshake → `ui/notifications/initialized` →
`ui/notifications/tool-input` / `tool-result` → `ui/message`), with
light/dark theme support from `hostContext.theme` and doubled initial
height via `ui/notifications/size-changed`.

## Transports

Two transports share the same server factory (`src/tools.ts` →
`buildServer()`):

- **stdio** — `src/stdio.ts`, for Claude Desktop / Claude Code
  (see [Claude](/docs/claude.md)). Never writes to stdout except JSON-RPC —
  stdout carries the protocol framing; all logs go to stderr.
- **HTTP** — `netlify/functions/mcp.mts`, a Netlify Function v2 served at
  `/mcp` (see [Netlify](/docs/netlify.md)).

## Implementation note

The official `@modelcontextprotocol/ext-apps` helper package currently
peer-depends on the **v1** SDK (`@modelcontextprotocol/sdk`), which this
project deliberately avoids. The Apps metadata (`_meta.ui.resourceUri` on
the tool, `text/html;profile=mcp-app` resource) and the view-side
postMessage protocol are therefore implemented directly against the MCP
Apps spec — no v1 dependency needed.

# Examples

```bash
# List tools (note _meta.ui.resourceUri)
npx @modelcontextprotocol/inspector --cli npx tsx src/stdio.ts --method tools/list | jq .

# Read the UI resource
npx @modelcontextprotocol/inspector --cli npx tsx src/stdio.ts \
  --method resources/read --uri "ui://prioritization/list.html" | jq .

# Call the tool (fallback output)
npx @modelcontextprotocol/inspector --cli npx tsx src/stdio.ts \
  --method tools/call --tool-name human_prioritization \
  --tool-arg 'items=["Fix login bug","Write docs","Refactor CI"]' | jq .
```

[^mcp-apps-spec]: MCP Apps specification (2026-01-26)
