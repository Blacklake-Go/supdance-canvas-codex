import { query } from "@anthropic-ai/claude-agent-sdk";

import { AGENT_PROMPT } from "../config.js";
import type { AgentEmit } from "./types.js";

const activeTurns = new Map<string, AbortController>();
const turnClients = new Map<string, string>();

type ClaudeTurnOptions = { clientId?: string; onStart?: () => void; onFinish?: () => void };

/** 通过 Claude Agent SDK 运行本地 Claude Code 会话，并把工具连接到当前 Canvas Agent。 */
export function runClaudeTurn(prompt: string, emit: AgentEmit, options: ClaudeTurnOptions = {}) {
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) return { ok: false as const, error: "请输入任务内容" };
    if (activeTurns.size) return { ok: false as const, error: "Claude 正在运行，请等待当前任务完成" };

    const turnId = crypto.randomUUID();
    const controller = new AbortController();
    const clientId = options.clientId || "";
    try {
        options.onStart?.();
    } catch (error) {
        return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
    }
    activeTurns.set(turnId, controller);
    turnClients.set(turnId, clientId);
    emit("agent_bootstrap", { type: "claude.started", turnId, sourceClientId: clientId || undefined });
    void streamClaudeTurn(normalizedPrompt, turnId, clientId, controller, emit, options.onFinish);
    return { ok: true as const, turnId };
}

/** 仅中断指定的 Claude turn，避免其他标签误停正在执行的任务。 */
export function interruptClaudeTurn(turnId: string, clientId: string) {
    const controller = activeTurns.get(turnId);
    if (!controller || turnClients.get(turnId) !== clientId) return false;
    controller.abort();
    return true;
}

async function streamClaudeTurn(prompt: string, turnId: string, clientId: string, controller: AbortController, emit: AgentEmit, onFinish?: () => void) {
    let code = 0;
    try {
        const stream = query({
            prompt: `${AGENT_PROMPT}\n\n用户请求：${prompt}`,
            options: {
                abortController: controller,
                mcpServers: {
                    "supdance-canvas": { command: process.execPath, args: [process.argv[1] || "", "mcp"] },
                },
                allowedTools: ["mcp__supdance-canvas__*"],
                systemPrompt: { type: "preset", preset: "claude_code" },
                settingSources: ["user", "project", "local"],
            },
        });
        for await (const message of stream) {
            emit("agent_event", { agent: "claude", turnId, sourceClientId: clientId || undefined, ...message });
            if (message.type === "result" && message.subtype !== "success") code = 1;
        }
    } catch (error) {
        code = controller.signal.aborted ? 130 : 1;
        emit("agent_error", { agent: "claude", turnId, sourceClientId: clientId || undefined, message: error instanceof Error ? error.message : String(error) });
    } finally {
        activeTurns.delete(turnId);
        turnClients.delete(turnId);
        emit("agent_done", { agent: "claude", turnId, sourceClientId: clientId || undefined, code });
        onFinish?.();
    }
}
