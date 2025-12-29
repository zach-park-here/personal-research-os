/**
 * Desktop MCP Server
 *
 * Provides local file access tools without full indexing.
 * Tools are triggered on-demand by backend orchestrator.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { searchFiles } from './tools/search-files';
import { readFile } from './tools/read-file';
import { extractText } from './tools/extract-text';
import { listRecentFiles } from './tools/list-recent-files';
import { getMetadata } from './tools/get-metadata';

const server = new Server(
  {
    name: 'personal-research-os-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'search_files',
      description: 'Search for files by name or pattern in specified directories',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query or glob pattern' },
          path: { type: 'string', description: 'Base path to search in' },
          maxResults: { type: 'number', description: 'Max results to return', default: 20 },
        },
        required: ['query'],
      },
    },
    {
      name: 'read_file',
      description: 'Read contents of a specific file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute file path' },
        },
        required: ['path'],
      },
    },
    {
      name: 'extract_text',
      description: 'Extract text from PDFs, docs, or other binary formats',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to file' },
        },
        required: ['path'],
      },
    },
    {
      name: 'list_recent_files',
      description: 'List recently modified files in specified directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' },
          hours: { type: 'number', description: 'Hours to look back', default: 24 },
          maxResults: { type: 'number', default: 20 },
        },
      },
    },
    {
      name: 'get_metadata',
      description: 'Get file metadata (size, dates, type)',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
        },
        required: ['path'],
      },
    },
  ],
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_files':
      return await searchFiles(args);
    case 'read_file':
      return await readFile(args);
    case 'extract_text':
      return await extractText(args);
    case 'list_recent_files':
      return await listRecentFiles(args);
    case 'get_metadata':
      return await getMetadata(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

main().catch(console.error);
