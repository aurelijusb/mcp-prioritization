import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { buildServer } from './tools.js';

// CRITICAL: never write to stdout in this process — stdout carries JSON-RPC
// framing for the MCP client. All logging must go to stderr (console.error).
const server = buildServer();
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('MCP prioritization server running on stdio');
