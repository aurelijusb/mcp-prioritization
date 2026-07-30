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
  - id: openai-custom-ux
    resource: https://developers.openai.com/apps-sdk/build/custom-ux
    title: OpenAI Apps SDK — custom UX (widget CSP and domain)
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

## Forcing the tool to be called

Type **`@`** followed by the plugin name (`@Prioritize`) to invoke the
plugin explicitly instead of hoping the model picks it up:

```
@Prioritize Let me prioritize cities to visit
```

Without the `@` shortcut, phrasing that implies ranking usually works:

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

The CSP warning is a **submission requirement, not a connection error** — the
widget works in development regardless (*Review status: development*). It
maps to `_meta.ui.csp` on the UI resource:[^mcp-apps-spec][^openai-custom-ux]
which external origins the widget's iframe may contact (`connectDomains`,
`resourceDomains`, `frameDomains`). This view is fully self-contained (inline
CSS/JS, no external requests), so every list is empty. Keep allowlists as
narrow as possible: plugin review checks the declared policy against actual
UI behaviour. Set in `src/tools.ts` (see [Architecture](/docs/architecture.md)).

The domain warning is left unresolved on purpose: `ui.domain` is where
ChatGPT expects the widget's primary origin, but Claude's connector platform
assigns its own sandbox origin (`{hash}.claudemcpcontent.com`) and hard-fails
the connection ("Invalid ui.domain format") if the server declares any other
value. Since Claude is a hard error and ChatGPT's is a soft dev-mode warning,
`domain` is deliberately omitted from `UI_META`.

> ⚠️ **The metadata must be on the `resources/read` contents entry**, not
> only on the resource registration. The registration `_meta` surfaces in
> `resources/list`, but ChatGPT reads the CSP from the contents entry
> returned by `resources/read` — declaring it in just one place leaves the
> "Widget CSP is not set" warning in place. This project defines a single
> `UI_META` constant and passes it to both.

After redeploying, press **Refresh** on the plugin's *Information* panel so
ChatGPT re-reads the template metadata.

[^live-server]: Deployed MCP server (Netlify)
[^mcp-apps-spec]: MCP Apps specification (2026-01-26)
[^openai-custom-ux]: OpenAI Apps SDK — custom UX (widget CSP and domain)
