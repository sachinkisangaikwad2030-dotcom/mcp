# Remote Echo MCP

This project creates a minimal remote MCP server in JavaScript that echoes prompts back to the caller.

## Run locally

1. Install dependencies:
   npm.cmd install

2. Start the server:
   npm.cmd start

3. The server will listen on:
   http://localhost:3000/mcp

## What it exposes

- A `echo_prompt` tool that returns the submitted prompt as `Echo: ...`
- A streamable HTTP MCP endpoint at `/mcp`

## VS Code wiring

Add a remote MCP server configuration similar to this:

```json
{
  "servers": {
    "remote-echo": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

If your VS Code build expects a different field for remote MCP servers, keep the same URL and update the wrapper config around it.

## Development notes

- The server uses the official `@modelcontextprotocol/sdk`
- The endpoint is streamable HTTP, which is the recommended remote transport for MCP
- You can extend this server later with additional tools, prompts, or resources
