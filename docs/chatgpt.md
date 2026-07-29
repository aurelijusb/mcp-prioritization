---
type: Integration Guide
title: ChatGPT plugins
description: Adding the HTTP-hosted MCP server to ChatGPT and understanding the Widget CSP / domain submission warnings.
tags: [chatgpt, mcp, mcp-apps]
status: stable
generated: { by: claude-code/claude-fable-5, at: 2026-07-29T21:30:00Z }
sources:
  - id: live-server
    resource: https://mcp-prioritization.netlify.app/mcp
    title: Deployed MCP server (Netlify)
  - id: mcp-apps-spec
    resource: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
    title: MCP Apps specification (2026-01-26)
---

# ChatGPT

ChatGPT renders MCP Apps, so the drag-and-drop widget works there too.

## Adding the server

1. **Settings → Plugins → Browse plugins → (+) → Connection**
2. Under **Server URL** enter:
   `https://mcp-prioritization.netlify.app/mcp`[^live-server]
3. No authorization is needed (the server is public — the connection info
   shows *Authorization supported: None*).

After connecting, the plugin page lists the template
`ui://prioritization/list.html` and the `human_prioritization` tool.
Example queries to force the tool to be picked up:

```
List top 10 biggest cities in Lithuania
Let me prioritize cities to visit
```

## "Widget CSP is not set" / "Widget domain is not set" warnings

On the plugin's template page ChatGPT shows:

> Widget CSP is not set for this template. A CSP is required for app
> submission.
> Widget domain is not set for this template. A unique domain is required
> for app submission.

These are **submission requirements, not connection errors** — the widget
works fine in development (*Review status: development*). They map to the
optional `_meta.ui` fields on the UI resource in the MCP Apps
spec:[^mcp-apps-spec]

- `csp` — declares which external origins the widget's iframe may contact
  (`connectDomains`, `resourceDomains`, ...). This view is fully
  self-contained (inline CSS/JS, no external requests), so the correct
  declaration would be empty domain lists.
- `domain` — a unique origin the host uses to sandbox the widget for
  published apps.

Setting them would go in the resource registration in `src/tools.ts`
(see [Architecture](/docs/architecture.md)); they only become mandatory if
the app is submitted to the ChatGPT app directory.

[^live-server]: Deployed MCP server (Netlify)
[^mcp-apps-spec]: MCP Apps specification (2026-01-26)
