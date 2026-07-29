---
type: Integration Guide
title: Claude (Code, Desktop, Cowork)
description: Registering the stdio MCP server in Claude Code and Claude Desktop, and which Claude surfaces render the MCP Apps UI.
tags: [claude, claude-code, claude-desktop, mcp]
status: stable
generated: { by: claude-code/claude-fable-5, at: 2026-07-29T18:30:00Z }
---

# Claude (Code, Desktop, Cowork)

## MCP Apps support at a glance

| Surface | Tool works | Renders drag-and-drop UI |
| --- | --- | --- |
| Claude Cowork | ✅ | ✅ |
| Claude Desktop | ✅ | ✅ |
| Claude Code (CLI) | ✅ | ❌ (as of 2.1.220) |
| Claude Code (VS Code extension) | ✅ | ❌ (as of 2.1.220) |

Where the UI is not rendered, the tool returns only the fallback text
`Use MCP apps integration to rearrange elements`. For the interactive view
inside VS Code, use the *native* chat instead — see
[VS Code](/docs/vscode.md).

## Claude Code

```bash
claude mcp add prioritization -- npx tsx src/stdio.ts
```

Then check with `claude mcp list` or `/mcp` inside a session. For a
project-scoped, shareable registration use
`claude mcp add --scope project ...` (writes `.mcp.json`).

Debugging:

```bash
claude mcp list                    # is the server registered + connected?
claude mcp get prioritization      # exact command/args being run
claude --debug                     # run a session with MCP connection logs
```

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
window). Calling `human_prioritization` renders the drag-and-drop list
inline.

> **stdio rule:** the stdio entry point must never write to stdout except
> JSON-RPC — stdout carries the protocol framing. All logs go to stderr
> (`console.error`).
