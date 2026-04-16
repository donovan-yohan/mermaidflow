import type { ListSessionsOutput, ReadDiagramOutput, WriteDiagramOutput } from '@arielcharts/shared';
import { APP_NAME } from '@arielcharts/shared';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod/v4';
import { handleMcpToolCall } from './mcp.js';
import type { SessionManager } from './session-manager.js';

const participantSchema = z.object({
  name: z.string(),
  color: z.string(),
  type: z.enum(['human', 'agent']),
});

const sessionSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  participants: z.number(),
});

const readDiagramInputSchema = {
  session_id: z.string().describe('ArielCharts session identifier.'),
};

const writeDiagramInputSchema = {
  session_id: z.string().describe('ArielCharts session identifier.'),
  mermaid_text: z.string().describe('The full Mermaid diagram source to persist.'),
  actor_name: z.string().optional().describe('Optional display name for the actor making the change.'),
  actor_type: z.enum(['human', 'agent']).optional().describe('Optional actor type for activity logging.'),
  detail: z.string().optional().describe('Optional activity detail for the write event.'),
  participants: z.array(participantSchema).optional().describe('Optional participant list override preserved for existing business logic compatibility.'),
};

function createToolResult(payload: unknown): {
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
} {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('MCP tool payload must be a JSON object.');
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload as Record<string, unknown>,
  };
}

function createMcpServer(manager: SessionManager): McpServer {
  const server = new McpServer({
    name: APP_NAME,
    version: '0.1.0',
  });

  server.registerTool(
    'read_diagram',
    {
      description: 'Read the canonical Mermaid diagram text and active participants for a session.',
      inputSchema: readDiagramInputSchema,
      outputSchema: {
        mermaid_text: z.string(),
        participants: z.array(participantSchema),
      },
    },
    async (input) => {
      const output = (await handleMcpToolCall(manager, {
        tool: 'read_diagram',
        input,
      })) as ReadDiagramOutput;

      return createToolResult(output);
    },
  );

  server.registerTool(
    'write_diagram',
    {
      description: 'Replace the Mermaid diagram text for a session and emit the corresponding activity event.',
      inputSchema: writeDiagramInputSchema,
      outputSchema: {
        success: z.boolean(),
      },
    },
    async (input) => {
      const output = (await handleMcpToolCall(manager, {
        tool: 'write_diagram',
        input,
      })) as WriteDiagramOutput;

      return createToolResult(output);
    },
  );

  server.registerTool(
    'list_sessions',
    {
      description: 'List active ArielCharts sessions with titles and participant counts.',
      inputSchema: {},
      outputSchema: {
        sessions: z.array(sessionSummarySchema),
      },
    },
    async () => {
      const output = (await handleMcpToolCall(manager, {
        tool: 'list_sessions',
        input: {},
      })) as ListSessionsOutput;

      return createToolResult(output);
    },
  );

  return server;
}

export async function handleMcpStreamableHttpRequest(options: {
  manager: SessionManager;
  request: IncomingMessage;
  response: ServerResponse;
}): Promise<void> {
  const { manager, request, response } = options;
  const server = createMcpServer(manager);
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response);
  } finally {
    await Promise.allSettled([transport.close(), server.close()]);
  }
}
