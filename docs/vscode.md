---
type: Integration Guide
title: VS Code native chat
description: Testing the MCP Apps drag-and-drop widget in VS Code's built-in chat via .vscode/mcp.json.
tags: [vscode, mcp, mcp-apps]
status: stable
generated: { by: claude-code/claude-fable-5, at: 2026-07-29T18:30:00Z }
---

# VS Code (Insiders) native chat

VS Code's built-in chat renders MCP Apps, so this is the easiest way to see
the drag-and-drop widget locally. (The Claude Code VS Code *extension* does
not render it — see [Claude](/docs/claude.md).)

Create `.vscode/mcp.json` in the workspace root:

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
