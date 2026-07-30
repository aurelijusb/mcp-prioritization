import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { PRIORITIZATION_HTML } from './ui.js';

const UI_RESOURCE_URI = 'ui://prioritization/list.html';
const UI_MIME_TYPE = 'text/html;profile=mcp-app';

/**
 * Netlify injects DEPLOY_PRIME_URL/URL at runtime for every deploy (production
 * and previews alike) — unset for stdio. Used only to pick the tool's
 * fallback text below; NOT sent as `ui.domain` (see UI_META).
 */
const IS_HTTP = Boolean(process.env.DEPLOY_PRIME_URL ?? process.env.URL);

/**
 * MCP Apps view metadata. Hosts read this from BOTH the resource listing and
 * the `resources/read` contents entry — ChatGPT reads the contents entry, so
 * it must be repeated there or the widget shows "Widget CSP is not set".
 * The view is fully self-contained (inline CSS/JS, no external requests), so
 * every CSP allowlist is empty.
 *
 * `domain` is deliberately omitted: Claude's connector platform assigns its
 * own sandbox origin (`{hash}.claudemcpcontent.com`) and rejects any other
 * value with "Invalid ui.domain format", breaking the connector entirely.
 * ChatGPT's "Widget domain is not set" warning is a submission-only notice
 * (widget still works in development), so leaving it unset is the value that
 * works everywhere.
 */
const UI_META = {
  ui: {
    prefersBorder: true,
    csp: {
      connectDomains: [],
      resourceDomains: [],
      frameDomains: [],
    },
  },
} as const;

export function buildServer(): McpServer {
  const server = new McpServer(
    { name: 'prioritization-server', version: '0.0.1' },
    { capabilities: { tools: {}, resources: {} } },
  );

  server.registerResource(
    'prioritization-ui',
    UI_RESOURCE_URI,
    {
      title: 'Human prioritization UI',
      description: 'Drag-and-drop ordered list for reordering items by priority.',
      mimeType: UI_MIME_TYPE,
      _meta: UI_META,
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: UI_MIME_TYPE,
          text: PRIORITIZATION_HTML,
          _meta: UI_META,
        },
      ],
    }),
  );

  server.registerTool(
    'human_prioritization',
    {
      title: 'Human prioritization',
      description:
        'Ask the human to prioritize a list of items. Renders an interactive drag-and-drop ' +
        'ordered list (MCP Apps UI); the human reorders the items and sends the prioritized ' +
        'list back to the chat.',
      inputSchema: z.object({
        items: z.array(z.string()).describe('Items to prioritize, in any order'),
      }),
      outputSchema: z.object({
        items: z.array(z.string()).describe('Items in their current order'),
      }),
      _meta: {
        ui: {
          resourceUri: UI_RESOURCE_URI,
          visibility: ['model', 'app'],
        },
      },
    },
    async ({ items }) => ({
      // Fallback for hosts without MCP Apps support; hosts with support
      // render the ui:// resource and the human replies via the view.
      content: [{ type: 'text', text: IS_HTTP ? 'Prioritized' : 'Prioritize locally' }],
      structuredContent: { items },
    }),
  );

  return server;
}
