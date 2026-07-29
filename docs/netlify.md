---
type: Integration Guide
title: Netlify deployment
description: The HTTP transport at /mcp, first-time Netlify project creation, and the GitHub Actions deploy pipeline.
tags: [netlify, github-actions, mcp]
status: stable
generated: { by: claude-code/claude-fable-5, at: 2026-07-29T18:30:00Z }
---

# Netlify

`netlify/functions/mcp.mts` exports `createMcpHandler(buildServer)` as a
Function v2 (`default export` + `export const config = { path: '/mcp' }`).
After `netlify deploy`, the MCP endpoint is `https://<site>.netlify.app/mcp`
(Streamable HTTP; stateless legacy 2025-era clients are also served by
default).

## First-time project creation (upload approach)

There is **no build/generation step** for the static files: `public/` is a
hand-written folder checked into the repo (`public/index.html`, the landing
page). The `/mcp` server is not a static file — it is a Netlify Function,
bundled from `netlify/functions/mcp.mts` by the Netlify CLI at deploy time.

1. In the [Netlify dashboard](https://app.netlify.com/), go to
   **Add new project → Deploy manually** ("Upload your project files") and
   drag & drop the existing `public/` folder as-is. This creates the project
   instantly and serves the landing page (no `/mcp` yet).

   > Drag & drop uploads **static files only** — the `/mcp` function is not
   > deployed this way. The first real function deploy happens via GitHub
   > Actions (or a local `netlify deploy --prod`) below.

2. Collect the two values the GitHub Actions workflows need:
   - **`NETLIFY_SITE_ID`** — in the new project: **Project configuration →
     General → Project details → Project ID**.
   - **`NETLIFY_AUTH_TOKEN`** — [User settings → Applications → Personal
     access tokens](https://app.netlify.com/user/applications) →
     **New access token**.

3. Add them to the GitHub repository under **Settings → Secrets and
   variables → Actions** — at the **repository** level, not as GitHub
   Environment values:
   - `NETLIFY_AUTH_TOKEN` — *Secrets* tab → **New repository secret**
   - `NETLIFY_SITE_ID` — *Variables* tab → **New repository variable**

   > **Repository vs Environment:** repository-level secrets/variables are
   > visible to all workflows in the repo. *Environment* secrets/variables
   > belong to a named GitHub Environment (e.g. `production`) and are only
   > injected into jobs that declare `environment: <name>` — optionally
   > gated by protection rules (required reviewers, branch restrictions).
   > The workflows here declare no `environment:`, so Environment-scoped
   > values would be invisible to them — use the repository level.

4. Push to `main` (or open a PR): `deployment.yml` deploys production
   including the `/mcp` function; `netlify-preview.yml` posts a preview URL
   on PRs.

## GitHub Actions

- `.github/workflows/deployment.yml` — on push to `main`: typecheck + MCP
  inspector smoke tests, then `netlify deploy --prod`.
- `.github/workflows/netlify-preview.yml` — on pull requests: same checks,
  then a draft deploy with a per-PR alias and a sticky PR comment with the
  preview URL and `/mcp` endpoint.

Build configuration lives in `netlify.toml` (publish dir `public/`,
functions from `netlify/functions` bundled with esbuild).
