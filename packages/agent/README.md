# @supdance/canvas-agent

The local HTTP and MCP bridge for the SupDance Canvas Codex plugin. This
package is built from source in the independent `supdance-canvas-codex`
repository and installed from a versioned npm tarball.

Commands:

```bash
supdance-canvas-agent open --handoff
supdance-canvas-agent open
supdance-canvas-agent mcp
supdance-canvas-agent
```

`open --handoff` starts or reuses the Agent and returns a short-lived local
link for the Codex browser. `open` uses the system browser. `mcp` serves Codex
tools over stdio. The final command runs the local HTTP Agent in the foreground.

Both processes use `~/.supdance-canvas/canvas-agent.json` and protocol 6.
Only `https://canvas.supdance.com` is permitted as a browser Origin. This
package does not call or depend on `@basketikun/canvas-agent` at runtime.

The source derives from basketikun's MIT-licensed Infinite Canvas Agent; see
the accompanying LICENSE and the repository NOTICE.md.
