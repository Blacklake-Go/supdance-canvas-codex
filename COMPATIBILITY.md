# Compatibility and acceptance

## Release candidate 0.1.3 — 2026-10-18

| Layer | Result | Evidence and limit |
| --- | --- | --- |
| Agent package | Built and packed | `@supdance/canvas-agent@0.1.3` needs Node.js 18+. TypeScript build succeeded and 135/135 package tests passed. |
| Codex CLI plugin | Connected | `supdance-canvas@supdance-local` is enabled. A fresh CLI session loaded the MCP tools, read the live board, and created one explicitly authorized text node. |
| Website connection | Connected | Local Chrome opened `https://canvas.supdance.com/canvas`; the page displayed **Codex 已连接** and the text node. No connection token appeared in the browser URL. |
| Agent restart | Reconnected automatically | An isolated candidate Agent on `127.0.0.1:17373` connected to the same live board. Stopping it changed the page to **连接失败**; restarting it restored **Codex 已连接** without user input. |
| Desktop Codex app | Open | A fresh desktop task did not expose the SupDance MCP tools although the CLI plugin is enabled. Official local-marketplace guidance requires restarting the desktop app and installing from its Plugins Directory; that app-side cycle has not yet been verified. |
| Paid generation | Not exercised | No image, video, or audio generation was invoked. Asset storage and credit settlement are outside this connection acceptance. |

The isolated 0.1.3 Agent used `SUPDANCE_CANVAS_CONFIG_DIR` and port `17373`; it did not replace the unrelated `@supdance/canvas-agent-workbuddy` service on port `17372`. The 0.1.3 startup output does not print the long-lived connect token.

The successful CLI tool call used `--approve-for-me`. The default CLI policy on this workstation rejected the same MCP call with “MCP tool call requires approval, but approval policy is never.” Plugin registration alone does not imply tool calls are approved under every Codex policy.

## Compatibility

- **Codex CLI:** plugin-aware CLI `0.162.0-alpha.17.2` on this macOS host.
- **Node.js:** package requirement `>=18`; tested locally with `v26.7.0`.
- **Protocol:** Agent/website protocol version 6. Browser requests use `x-canvas-agent-token`; SSE starts with a one-use, origin/client-bound ticket from `POST /events-ticket`. Ticket lifetime is 60 seconds.
- **Agent reuse:** a newer patch in the same `0.1.x` line is accepted only if protocol 6 matches; unrelated, older, and incompatible services are rejected.
- **Distribution:** local Codex marketplace and npm tarball. The Agent has not been published to npm; install from this repository's release tarball.
- **GitHub marketplace:** a clean, isolated Codex configuration installed `supdance-canvas@supdance-local` version `0.1.3` from `Blacklake-Go/supdance-canvas-codex --ref main` after the `07369b0` push. The repository is currently private, so installers need repository access.
- **Platforms:** macOS browser workflow was exercised. Windows and Linux launch behavior and the portable non-Codex plugin format are unverified.

## Website source provenance

The live site served `index-CwaX-uw5.js` and `index-BxQPPkSm.css` on 2026-10-18. The JavaScript SHA-256 was `2572fa0b87d761f852fa2a479d1ff2fe1b58055b10468c8273bae860469d13d5`. The public bundle contains the ticket endpoint, auth header, protocol checks, fragment bootstrap, and history replacement. Its exact source commit is still unknown. No website files were changed or deployed during this acceptance.

[`website-adaptation.patch`](website-adaptation.patch) is based on `infinite-canvas` commit `f1ad63d`; it is reference material until the exact source for the live bundle is identified.

## Previous acceptance — 2026-10-16

The earlier 0.1.0 plugin loaded in a fresh Codex task and read a current board with `hasCanvas: true`; it created no content. That older live Agent recovered from a restart only after a manual **连接** click. This historical result should not be used as evidence for candidate 0.1.3. The separate current restart observation above establishes automatic browser reconnection for 0.1.3.
