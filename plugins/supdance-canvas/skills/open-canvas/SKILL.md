---
name: open-canvas
description: 用户要求打开、连接或使用 SupDance 画布时，启动本地 Agent 并打开 https://canvas.supdance.com/canvas。
---

# 打开 SupDance 画布

1. 在本机终端执行 `supdance-canvas-agent open --handoff`。如用户明确要求最近画布或自己选择，分别追加 `--mode=recent` 或 `--mode=choose`；提供准确画布 ID 时追加 `--project=<ID>`。
2. 命令会启动或复用只监听本机的 SupDance Agent，并输出一个短时、单次使用的本机打开地址。用 Codex 的浏览器面板打开该地址；若无浏览器面板，运行 `supdance-canvas-agent open` 在系统浏览器打开。不要向用户展示长期连接 token。
3. 网页加载后，使用 `supdance-canvas` 的 `canvas_get_state` 确认当前画布已连接。若尚未连接，说明具体错误并检查本地 Agent 健康状态；不要用网页 200 代替连接成功。

MCP 进程由插件在新 Codex 任务中加载；`open` 命令负责另一个本地 HTTP 进程。两者读取同一份 SupDance 配置，用户无需手动填 URL 或 token。
