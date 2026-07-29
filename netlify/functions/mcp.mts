import type { Config } from '@netlify/functions';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { buildServer } from '../../src/tools.js';

const handler = createMcpHandler(buildServer);

export default (req: Request): Promise<Response> => handler.fetch(req);

export const config: Config = { path: '/mcp' };
