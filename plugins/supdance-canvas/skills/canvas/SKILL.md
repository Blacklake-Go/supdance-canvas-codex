---
name: canvas
description: 读取和操作 SupDance 当前网页画布，包括节点、选区、提示词和生成流程。
---

# SupDance 画布

- 若网页未连接，先按 `open-canvas` 技能启动并连接。
- 操作前使用 `supdance-canvas` MCP 的 `canvas_get_state` 读取当前画布；提及选中内容时先读取 `canvas_get_selection`。
- 只创建或配置流程时保持 `autoRun=false`；用户明确要求生成时才调用生成工具。实际生成结果和费用应以网站任务记录为准。
- 创建文本优先使用 `canvas_create_text_node`；批量节点和连线使用 `canvas_apply_ops`。
- 不要求用户复制 JSON、Local URL 或 Connect token；不把本地连接成功说成网站付费生成已验证。
