# MCP Prioritization

A "human prioritization" MCP server built with the official MCP TypeScript SDK
**v2** (`@modelcontextprotocol/server@^2.0.0`, spec 2026-07-28) and the
**MCP Apps** extension (spec 2026-01-26): the tool ships an interactive
`ui://` HTML view that hosts like Claude Cowork render as a sandboxed iframe.

## What it does

- **Tool `human_prioritization`** — input `{ items: string[] }`, output
  `{ items: string[] }`. The tool's `_meta.ui.resourceUri` points at the UI
  resource; hosts without MCP Apps support get the fallback text
  `Use MCP apps integration to rearrange elements`.
- **Resource `ui://prioritization/list.html`** (`text/html;profile=mcp-app`) —
  an ordered list you reorder by **mouse drag & drop** or **keyboard**
  (↑/↓ moves focus, Alt+↑/Alt+↓ or Ctrl+↑/Ctrl+↓ moves the item). The
  **"Send priorities to chat"** button posts `Prioritized:` followed by the
  numbered markdown list back into the conversation via the `ui/message`
  request.

The view speaks the MCP Apps postMessage JSON-RPC protocol directly
(`ui/initialize` handshake → `ui/notifications/initialized` →
`ui/notifications/tool-input` / `tool-result` → `ui/message`), with light/dark
theme support from `hostContext.theme`.

Two transports share the same server factory (`src/tools.ts`):

- **stdio** — `src/stdio.ts`, for Claude Desktop / Claude Code
- **HTTP** — `netlify/functions/mcp.mts`, a Netlify Function v2 served at `/mcp`

## Setup

Requires Node.js 26 (see `.nvmrc`) and uses TypeScript 7 (native compiler).

```bash
nvm use          # picks up .nvmrc (26.5.1)
npm install
npm run typecheck   # tsc --noEmit
```

## Try it locally

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

## Claude Code

> **Note:** Claude Code does **not** render MCP Apps UI — neither the CLI nor
> the VS Code extension (as of Claude Code 2.1.220). The tool itself works,
> but instead of the drag-and-drop widget you only get the fallback text
> `Use MCP apps integration to rearrange elements`. For the interactive view,
> use Claude Cowork / Claude Desktop — or VS Code's *native* chat
> (`.vscode/mcp.json`), which does render MCP Apps.

```bash
claude mcp add prioritization -- npx tsx src/stdio.ts
```

Then check with `claude mcp list` or `/mcp` inside a session.

## VS Code (Insiders) native chat

VS Code's built-in chat renders MCP Apps, so this is the easiest way to see
the drag-and-drop widget. Create `.vscode/mcp.json` in the workspace root:

```json
{
  "servers": {
    "prioritization": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "${workspaceFolder}/src/stdio.ts"]
    }
  }
}
```

Alternatively, add it from the command line:

```bash
code-insiders --add-mcp '{"name":"prioritization","type":"stdio","command":"npx","args":["tsx","/path/to/mcp-apps-test-netlify/src/stdio.ts"]}'
```

Then open Chat (Ctrl+Alt+I), switch to **Agent** mode, and start the server
via **MCP: List Servers** (or the *Start* code-lens shown inline in
`mcp.json`).

To make the agent actually call the tool, reference it with `#` in the
prompt (typing `#` opens tool autocomplete; `@` is for chat participants
and won't work):

```
Let me #human_prioritization the top Lithuanian cities to visit
```

The tool call renders the drag-and-drop list inline; after reordering,
**"Send priorities to chat"** posts the `Prioritized:` numbered list back
into the conversation. If the model answers from its own knowledge instead
of calling the tool, pick a stronger model in the model picker — small/fast
models tend to fake the JSON output rather than issue a real tool call.

## Claude Desktop (Linux)

Edit (or create) the config file:

```
~/.config/Claude/claude_desktop_config.json
```

Add the server under `mcpServers`:

```json
{
  "mcpServers": {
    "prioritization": {
      "command": "npx",
      "args": [
        "tsx",
        "/path/to/mcp-apps-test-netlify/src/stdio.ts"
      ]
    }
  }
}
```

Restart Claude Desktop completely (quit from the tray, not just close the
window). In a host with MCP Apps support (e.g. Claude Cowork), calling
`human_prioritization` renders the drag-and-drop list inline.

> **stdio rule:** the stdio entry point must never write to stdout except
> JSON-RPC — stdout carries the protocol framing. All logs go to stderr
> (`console.error`).

## Netlify

`netlify/functions/mcp.mts` exports `createMcpHandler(buildServer)` as a
Function v2 (`default export` + `export const config = { path: '/mcp' }`).
After `netlify deploy`, the MCP endpoint is `https://<site>.netlify.app/mcp`
(Streamable HTTP; stateless legacy 2025-era clients are also served by
default).

## Implementation note

The official `@modelcontextprotocol/ext-apps` helper package currently
peer-depends on the **v1** SDK (`@modelcontextprotocol/sdk`), which this
project deliberately avoids. The Apps metadata (`_meta.ui.resourceUri` on the
tool, `text/html;profile=mcp-app` resource) and the view-side postMessage
protocol are therefore implemented directly against the MCP Apps spec — no v1
dependency needed.
