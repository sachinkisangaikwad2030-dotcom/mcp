#!/usr/bin/env node

const readline = require('readline');

const SERVER_INFO = {
  name: 'echo-stdio-mcp',
  version: '1.0.0'
};

const CAPABILITIES = {
  tools: {
    listChanged: false
  }
};

const TOOLS = [
  {
    name: 'echo',
    description: 'Echo a message back to the caller',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to echo back'
        }
      },
      required: ['message'],
      additionalProperties: false
    }
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendError(id, code, message) {
  send({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message
    }
  });
}

function sendResult(id, result) {
  send({
    jsonrpc: '2.0',
    id,
    result
  });
}

function handleMessage(message) {
  const { id, method, params } = message;

  if (method === 'initialize') {
    return sendResult(id, {
      protocolVersion: '2024-11-05',
      capabilities: CAPABILITIES,
      serverInfo: SERVER_INFO
    });
  }

  if (method === 'ping') {
    return sendResult(id, {});
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    return sendResult(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const argumentsObject = params?.arguments || {};

    if (toolName !== 'echo') {
      return sendError(id, -32601, `Unknown tool: ${toolName}`);
    }

    if (typeof argumentsObject.message !== 'string') {
      return sendError(id, -32602, 'Invalid params: message must be a string');
    }

    return sendResult(id, {
      content: [
        {
          type: 'text',
          text: argumentsObject.message
        }
      ]
    });
  }

  return sendError(id, -32601, `Method not found: ${method}`);
}

rl.on('line', (line) => {
  if (!line.trim()) {
    return;
  }

  let message;

  try {
    message = JSON.parse(line);
  } catch (error) {
    sendError(null, -32700, 'Parse error');
    return;
  }

  try {
    handleMessage(message);
  } catch (error) {
    if (message && Object.prototype.hasOwnProperty.call(message, 'id')) {
      sendError(message.id, -32603, 'Internal error');
    }
  }
});

process.on('SIGINT', () => {
  process.exit(0);
});
