# Compatibility and acceptance

## Compatibility matrix

| Layer | Candidate requirement | Evidence |
| --- | --- | --- |
| Codex CLI | Plugin-aware Codex CLI; verified on `0.162.0-alpha.17.2` | CLI lists `supdance-canvas@supdance-local` installed and enabled; this task successfully called its live canvas tool. |
| Node.js | `>=18` | Package declares Node 18 minimum; local workstation uses `v26.7.0`. |
| SupDance plugin | `0.1.1` | Independent plugin manifest and `@supdance/canvas-agent` package. |
| Plugin format | Codex local marketplace plus portable Agent Plugins 1.0.0 manifest | Codex CLI `0.162.0-alpha.17.2` installed and listed candidate `0.1.1` from the local marketplace in an isolated `CODEX_HOME`; removal of the plugin and marketplace also succeeded. The portable non-Codex install path has not been exercised. |
| MCP | Protocol version `6` | Kept aligned with the existing website Agent protocol. |
| Website | Must implement header-authenticated `POST /events-ticket` and ticket-authenticated `GET /events` | Implemented in the paired website candidate; production deployment has not been confirmed. |
| Operating system | macOS local Agent workflow | Verified on the current macOS workstation. Windows and Linux browser-launch behavior has not been checked. |

The package has not been published to npm. Do not use `npx @supdance/canvas-agent`
until a public or private npm release exists. Install the tarball produced by
`npm pack` from this source checkout.

## Connection acceptance

### Candidate plugin install/uninstall — 2026-10-16

- In an isolated Codex configuration, the local checkout was added as the
  `supdance-local` marketplace and `supdance-canvas@supdance-local` installed
  as version `0.1.1`.
- `codex plugin list` confirmed the candidate version and enabled status;
  `codex mcp list` showed the `supdance-canvas` server entry.
- The plugin and marketplace were removed from the isolated configuration,
  and the final plugin list contained no marketplace plugins.
- This verifies Codex CLI registration and removal. It does not load the
  candidate in a fresh interactive Codex task or verify its Agent against the
  production website; the installed live plugin and Agent remain `0.1.0`.

## Live check — 2026-10-16

- The installed and enabled plugin and local Agent are `0.1.0`.
- `codex mcp list` shows `supdance-canvas` enabled; it shows no
  `infinite-canvas` MCP entry on this host.
- Current `codex plugin list` and `codex plugin marketplace list` both exit
  successfully. The working `supdance-local` marketplace points at this
  repository; the previously reported broken `personal` marketplace is not
  blocking the current CLI listing.
- The authenticated local Agent identity endpoint on port `17372` reports
  protocol `6`, but no package version. The protected config file has mode
  `0600`. Candidate Agent `0.1.1` was invoked against this running legacy
  process and returned a clear message to install `0.1.1`, stop the old Agent,
  and retry. The old process was left running.
- `supdance-canvas-agent open --handoff --mode=recent` opened the current
  SupDance canvas through the local Agent.
- The site showed **Codex 已连接**, and `canvas_get_state` returned
  `hasCanvas: true` with the current board and its text node.
- After restarting the local `0.1.0` Agent, the page showed a connection
  failure and `canvas_get_state` reported no connected canvas. Clicking the
  page's **连接** control restored the connection; `canvas_get_state` then
  returned `hasCanvas: true` again. The current live release therefore recovers
  by manual reconnect, while the candidate retry behavior still needs the
  paired website release.
- No image, video, audio, or other generation tool was called.

## Fresh Codex task — 2026-10-16

A separate Codex task, `SupDance Canvas 插件新任务验收`, loaded the installed
plugin and MCP, used the open-canvas flow, and read the same current board with
`hasCanvas: true` (one existing node, zero connections). It created no content
and triggered no generation. This verifies the installed 0.1.0 plugin in a
fresh task; it does not verify the 0.1.1 candidate.

This verifies the existing independent `0.1.0` plugin against the live website.
Candidate `0.1.1` changes the connection contract: browser API requests use
headers and SSE uses a one-use ticket. Its paired website worktree contains
that contract, but production still serves the older bundle, so `0.1.1` has not
been installed or deployed.

The current dirty `canvas-web` checkout was built in an isolated temporary copy
with `build:koyosim`; it produced `index-Ddu1Q_yM.js` and
`index-BiwMqt3B.css`. A fresh check on 2026-10-16 confirmed production still
serves `index-Cki82JQU.js` and `index-CrKn1nWx.css`. Their live SHA-256 values
are `c68ccbf90badfea51ec4f33b743fcd33f6d1ee36959bb5034ac43a3c747743ed` and
`914ca524b6ddcaa9bf90779a60d496ccbbaa19938f1c2242ab43da14a2a64d5e`.
The current local `web/dist` files are `index-Df2M1XAa.js` and
`index-MBAT8Yma.css`; their hashes differ from production. An earlier local
copy that appeared to match is stale and is not a usable source snapshot.

The known GitHub source candidate is
`https://github.com/basketikun/infinite-canvas.git`. Its remote `main` currently
points to `3a6b64b602ad062b29fac66902ed18a7ef5fd9dc` (2026-10-10), which only
adds workspace lock/config files and does not identify the SupDance production
source. The local `f1ad63d` baseline also builds different assets. No exact
repository commit or CI artifact has been tied to the production hashes yet.

A second isolated build from the clean local Git base `f1ad63d` produced
`index-DKVuycuP.js` and `index-BxQPPkSm.css`, which also do not match the live
assets. Server backup inspection found an older 2026-10-14 working-tree archive
at `HEAD c0c584b`; its recorded build asset is `index-CXbkrMS3.js`, also not the
current live `index-Cki82JQU.js`. The Canvas host has static files but no source
checkout or source map. A server-side source search found only a separate
Next.js release copy for the main site, plus older Canvas build/source archives;
none matches the current live asset hashes. Keep the paired website change off
production until its exact source or build provenance is located.

The 0.1.1 Agent identity endpoint now reports both the Agent package version
and protocol version. The `open` command explains a legacy Agent, a package
version mismatch, or a protocol mismatch instead of silently reusing an old
process on port 17372.

The 0.1.1 Agent package was rebuilt and packed after this change. Its complete
test suite passes 133/133 tests, and the TypeScript build succeeds. Local HTTP
acceptance tests on temporary home directories and ports verify Agent and
protocol versions, clear errors for an old Agent or another process occupying
the port, rejection of a long-lived token in the query, exact-origin/client
binding, one-use SSE tickets, and launch redirects for new, recent, choose, and
specific canvases. Launch credentials are placed in the fragment, not the query.
The source sets ticket expiry to 60 seconds. These are candidate-package
checks; site restart and retry behavior still requires a matching website
release.

The `0.1.1` release acceptance check must confirm all of the following without
running a paid generation:

- A fresh Codex task loads `supdance-canvas` and `canvas_get_state` returns the
  current site board.
- A text node can be created and read back, proving MCP-to-website operations.
- The website uses port `17372`, stores the long-lived token in the current tab
  session only, and has no bearer token in query strings or browser history.
- An SSE ticket expires after 60 seconds, is tied to the exact origin and
  client ID, and cannot be reused.
- A dropped connection requests a replacement ticket on the existing
  EventSource retry cadence (about 3 seconds). After three consecutive
  failures the page shows the Agent as offline while retrying continues; the
  connection panel keeps a manual reconnect action.
- Local Agent restart reconnects the website without exposing the long-lived
  token or requiring manual token entry.

The Codex plugin and tool checks do not establish image generation, asset
storage, or credit settlement.
