import { randomUUID } from 'node:crypto';
import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const PORT = Number(process.env.PORT || 3000);

const getServer = () => {
  const server = new McpServer(
    {
      name: 'remote-echo-mcp',
      version: '1.0.0'
    },
    {
      capabilities: { tools: {} }
    }
  );

  server.registerTool(
    'echo_prompt',
    {
      title: 'Echo Prompt',
      description: 'Echoes the prompt text back to the client.',
      inputSchema: {
        prompt: z.string().describe('The prompt text to echo back.')
      }
    },
    async ({ prompt }) => ({
      content: [
        {
          type: 'text',
          text: `Echo: ${prompt}`
        }
      ]
    })
  );

  return server;
};

const transports = {};
const app = createMcpExpressApp();

const handlePost = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (sessionId && transports[sessionId]) {
    await transports[sessionId].handleRequest(req, res, req.body);
    return;
  }

  if (!sessionId && isInitializeRequest(req.body)) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        transports[newSessionId] = transport;
      }
    });

    transport.onclose = () => {
      const currentSessionId = transport.sessionId;
      if (currentSessionId && transports[currentSessionId]) {
        delete transports[currentSessionId];
      }
    };

    const server = getServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    return;
  }

  res.status(400).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Bad Request: No valid session ID provided'
    },
    id: null
  });
};

const handleGet = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (!sessionId || !transports[sessionId]) {
    res.type('html').send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Remote Echo MCP</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 2rem;">
          <h1>Remote Echo MCP</h1>
          <p>This URL is the MCP endpoint, not a browser page.</p>
          <p>Open the server from your MCP client, or use the POST endpoint to initialize a session.</p>
          <p>Server endpoint: <code>http://localhost:${PORT}/mcp</code></p>
          <p>Available tool: <code>echo_prompt</code></p>
          <p>If you want to inspect the server, visit <code>http://localhost:${PORT}/</code>.</p>
        </body>
      </html>
    `);
    return;
  }

  await transports[sessionId].handleRequest(req, res);
};

const handleDelete = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  await transports[sessionId].handleRequest(req, res);
};

app.post('/mcp', handlePost);
app.get('/mcp', handleGet);
app.delete('/mcp', handleDelete);

app.get('/', (_req, res) => {
  res.json({
    name: 'remote-echo-mcp',
    endpoint: '/mcp',
    note: 'Use the /mcp endpoint as your remote MCP server URL.'
  });
});

app.listen(PORT, () => {
  console.log(`Remote MCP server listening on http://localhost:${PORT}`);
  console.log('Use /mcp as the remote MCP endpoint.');
});

process.on('SIGINT', async () => {
  for (const sessionId of Object.keys(transports)) {
    await transports[sessionId].close();
    delete transports[sessionId];
  }
  process.exit(0);
});
