# SupDance Canvas Codex plugin

Connects Codex to the currently open SupDance Canvas through the local Canvas
Agent. The plugin package is version `0.1.7`; its paired Agent package is
`@supdance/canvas-agent` version `0.1.3` and uses protocol 6.

## Latest desktop acceptance — 2026-10-21

Codex loaded the `supdance-canvas` tools and successfully read the current
canvas. The UI showed the Agent as connected, and `canvas_get_state` still
returned `hasCanvas: true` after refreshing the page. The board had zero nodes
and zero connections; no generation was run.

- [Open the verified canvas](https://canvas.supdance.com/canvas)
- [Connection screenshot](../../screenshots/supdance-canvas-connected.jpg)

![SupDance Canvas showing the connected local Agent](../../screenshots/supdance-canvas-connected.jpg)

The supplied SupDance logo is stored at [`assets/logo.png`](assets/logo.png).
For installation and recovery instructions, see the repository
[README](../../README.md) and [compatibility record](../../COMPATIBILITY.md).
