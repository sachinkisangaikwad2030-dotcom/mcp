# Echo stdio MCP server

A minimal Node.js MCP server that exposes a single `echo` tool over stdio.

## Files

- `server.js` – the MCP server implementation
- `package.json` – package metadata and `start` script

## Run locally

From the project folder:

```bash
node server.js
```

If you prefer the `npm` script:

```bash
npm start
```

> On Windows, `npm` may be blocked by PowerShell execution policy. If that happens, use `node server.js` directly.

## Test the server manually

You can send JSON-RPC lines to stdin:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"echo","arguments":{"message":"hello"}}}
```

Expected output is newline-delimited JSON responses.

## Example Claude Desktop configuration

Add this to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "echo-stdio": {
      "command": "node",
      "args": [
        "C:/Users/hp/IdeaProjects/MCPNew/mcp/server.js"
      ]
    }
  }
}
```

If `node` is not on your PATH, use the full path to Node instead:

```json
{
  "mcpServers": {
    "echo-stdio": {
      "command": "C:/Program Files/nodejs/node.exe",
      "args": [
        "C:/Users/hp/IdeaProjects/MCPNew/mcp/server.js"
      ]
    }
  }
}
```

## Example Cursor configuration

If your Cursor MCP config supports stdio servers, add the same entry:

```json
{
  "mcpServers": {
    "echo-stdio": {
      "command": "node",
      "args": [
        "C:/Users/hp/IdeaProjects/MCPNew/mcp/server.js"
      ]
    }
  }
}
```

## Notes

- The current tool schema accepts a required `message` string.
- If you want, you can extend this server with more tools or richer responses.
