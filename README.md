# SupDance Canvas for Codex

An independent Codex plugin for `https://canvas.supdance.com/canvas`. It ships
its own local MCP Agent and open-canvas skills, with a separate config directory,
MCP name, and loopback port from the upstream Infinite Canvas plugin.

## Requirements

- macOS and Codex CLI with plugin support.
- Node.js 18 or newer.
- The plugin includes both the portable Agent Plugins manifest (`plugin.json`
  and `mcp.json`) and the Codex compatibility manifest under
  `plugins/supdance-canvas/.codex-plugin/`.
- A website build that supports the SupDance Agent v6 connection-ticket API:
  `POST /events-ticket` with `x-canvas-agent-token`, followed by
  `GET /events?ticket=...`. The current public JavaScript bundle contains
  these protocol markers and fragment bootstrap handling. Its exact source
  commit is still unknown; do not deploy another website build until its source
  is matched.

## Install from this checkout

The 0.1.3 package is a candidate. The live page exposes the v6
header-authenticated ticket flow. CLI MCP read/write and browser reconnect
acceptance completed on 2026-10-18; desktop app tool loading remains open.

The paired website changes are included as
[`website-adaptation.patch`](website-adaptation.patch). It is based on the
`infinite-canvas` source commit `f1ad63d`. The live static bundle does not match
that clean source build, so this patch is for review and matching-source
integration; do not apply it to an unverified production checkout.

```bash
cd packages/agent
npm ci
npm run build
npm pack
npm install -g ./supdance-canvas-agent-0.1.3.tgz
cd ../..
codex plugin marketplace add "$(pwd)"
codex plugin add supdance-canvas@supdance-local
```

After installing the paired Agent tarball, the private GitHub repository can
also be used as the marketplace source:

```bash
codex plugin marketplace add Blacklake-Go/supdance-canvas-codex --ref main
codex plugin add supdance-canvas@supdance-local
```

Open a new Codex task and ask “打开 SupDance 画布”. The skill starts or reuses
the local Agent, creates a one-use 60-second launch link, and opens it in the
Codex browser. The website then connects to the local Agent automatically. If
the Codex browser is unavailable, run `supdance-canvas-agent open` to use the
system browser. The local package is not published to npm; install it from this
checkout or a supplied package archive.

A prebuilt 0.1.3 candidate tarball is available at
[`releases/supdance-canvas-agent-0.1.3.tgz`](releases/supdance-canvas-agent-0.1.3.tgz).
Install it with `npm install -g ./releases/supdance-canvas-agent-0.1.3.tgz`.

If port `17372` is occupied, `open` checks the Agent identity before using it.
It reuses a newer patch release from the same `0.1.x` line only when protocol
version 6 matches; older or incompatible versions and unrelated services get
a specific error instead of being silently reused.

## Verify the connection

1. `codex plugin list` shows `supdance-canvas@supdance-local` enabled.
2. Start a new task and ask it to read the current canvas.
3. `canvas_get_state` returns the live board state.
4. Create a text node only when you want a visible, non-generative connection
   check. Do not run a generation unless you separately intend to do so.

Use `codex plugin list` to verify the plugin is enabled, `codex mcp list` to
check the `supdance-canvas` server, and a live `canvas_get_state` call to verify
that the website and local Agent are connected.

## Uninstall

```bash
codex plugin remove supdance-canvas@supdance-local
codex plugin marketplace remove supdance-local
npm uninstall -g @supdance/canvas-agent
```

These commands remove the plugin registration and local Agent package. To
remove Agent data as well, delete `~/.supdance-canvas/` after preserving any
conversation metadata or workspace files you need.

## Security model

- Agent HTTP binds to `127.0.0.1:17372` and accepts browser origins only from
  `https://canvas.supdance.com`.
- The long-lived token is stored in
  `~/.supdance-canvas/canvas-agent.json` with directory mode `0700` and file
  mode `0600`.
- Browser API requests send the token in `x-canvas-agent-token`; the website
  keeps it in the current tab's `sessionStorage` and removes the fragment after
  bootstrap.
- SSE uses a one-use ticket bound to the website origin and client ID. It
  expires after 60 seconds; a disconnected page requests a replacement about
  every 3 seconds. After three consecutive failures the connection panel shows
  the Agent as offline and keeps manual reconnect available.
- No paid generation is needed for plugin acceptance. MCP connection and a
  successful tool call do not prove image generation, asset storage, or credit
  settlement.

See [PLUGIN_PLAN.md](PLUGIN_PLAN.md) for the architecture and adaptation plan,
[COMPATIBILITY.md](COMPATIBILITY.md) for verification status, and
[NOTICE.md](NOTICE.md) and [LICENSE](LICENSE) for source attribution.
