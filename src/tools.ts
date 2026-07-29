import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { PRIORITIZATION_HTML } from './ui.js';

const UI_RESOURCE_URI = 'ui://prioritization/list.html';
const UI_MIME_TYPE = 'text/html;profile=mcp-app';

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
      _meta: {
        ui: {
          prefersBorder: true,
          // The view is fully self-contained (inline CSS/JS, no external
          // requests), so the declared CSP is "contact nothing".
          csp: {
            connectDomains: [],
            resourceDomains: [],
          },
        },
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: UI_MIME_TYPE,
          text: PRIORITIZATION_HTML,
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
      content: [{ type: 'text', text: 'Use MCP apps integration to rearrange elements' }],
      structuredContent: { items },
    }),
  );

  return server;
}
