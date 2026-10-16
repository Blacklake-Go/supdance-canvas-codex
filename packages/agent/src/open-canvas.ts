import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";

import { AGENT_PROTOCOL_VERSION } from "./canvas/session.js";
import { loadConfig, VERSION } from "./config.js";

type Identity = { ok?: boolean; service?: string; agentVersion?: string; protocolVersion?: number; url?: string };

/** 启动或复用本地 Agent，并在默认浏览器打开已连接的 SupDance 画布。 */
export async function openCanvas(args: string[]) {
    const mode = args.find((arg) => arg.startsWith("--mode="))?.slice(7) || "new";
    const projectId = args.find((arg) => arg.startsWith("--project="))?.slice(10) || "";
    const noBrowser = args.includes("--no-browser");
    const handoff = args.includes("--handoff");
    if (!["new", "recent", "choose"].includes(mode)) throw new Error("mode must be new, recent, or choose");
    if (projectId && !/^[A-Za-z0-9_-]+$/.test(projectId)) throw new Error("invalid project ID");

    const config = loadConfig(true);
    let currentIdentity = await identity(config.url, config.token);
    let issue = currentIdentity ? getAgentIdentityError(currentIdentity, config.url) : null;
    let ready = currentIdentity !== null && issue === null;
    if (!ready) {
        if (await portOccupied(config.url)) {
            throw new Error(issue || `SupDance Agent port is occupied by another process: ${config.url}`);
        }
        const entry = fileURLToPath(new URL("./index.js", import.meta.url));
        const child = spawn(process.execPath, [entry], { detached: true, stdio: "ignore", env: process.env });
        child.unref();
        for (let attempt = 0; attempt < 40; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            currentIdentity = await identity(config.url, config.token);
            issue = currentIdentity ? getAgentIdentityError(currentIdentity, config.url) : null;
            ready = currentIdentity !== null && issue === null;
            if (ready) break;
            if (issue && await portOccupied(config.url)) throw new Error(issue);
        }
    }
    if (!ready) throw new Error(issue || "SupDance Agent did not become ready; check the local service log and port 17372");

    const response = await fetch(`${config.url}/launch`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-canvas-agent-token": config.token },
        body: JSON.stringify({ mode, projectId }),
    });
    if (!response.ok) throw new Error(`Agent launch failed: ${response.status}`);
    const launch = await response.json() as { url?: string };
    if (!launch.url?.startsWith(`${config.url}/launch/`)) throw new Error("Agent returned an invalid launch link");
    if (!noBrowser && !handoff) {
        const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
        const argv = process.platform === "win32" ? ["/c", "start", "", launch.url] : [launch.url];
        await new Promise<void>((resolve, reject) => {
            const browser = spawn(command, argv, { stdio: "ignore" });
            browser.once("error", reject);
            browser.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`browser open failed: ${code}`)));
        });
    }
    if (handoff) console.log(`Open this local one-time URL in the Codex browser: ${launch.url}`);
    else console.log(`SupDance Canvas Agent ready at ${config.url}; ${noBrowser ? "browser not opened" : "canvas opened"}.`);
}

export function getAgentIdentityError(value: Identity, expectedUrl: string): string | null {
    if (value.ok !== true || value.service !== "supdance-canvas-agent") {
        return `A different service is using the SupDance Canvas Agent port: ${expectedUrl}`;
    }
    if (!value.agentVersion) {
        return `A legacy SupDance Canvas Agent is running at ${expectedUrl}; install version ${VERSION}, stop the old Agent, then retry.`;
    }
    if (value.agentVersion !== VERSION) {
        return `SupDance Canvas Agent version mismatch at ${expectedUrl}: running ${value.agentVersion}, expected ${VERSION}. Stop the old Agent, then retry.`;
    }
    if (value.protocolVersion !== AGENT_PROTOCOL_VERSION) {
        return `SupDance Canvas Agent protocol mismatch: running ${String(value.protocolVersion)}, expected ${AGENT_PROTOCOL_VERSION}. Update the local Agent, then retry.`;
    }
    if (value.url !== expectedUrl) {
        return `SupDance Canvas Agent returned an unexpected local URL: ${value.url || "(missing)"}`;
    }
    return null;
}

async function identity(url: string, token: string): Promise<Identity | null> {
    try {
        const response = await fetch(`${url}/identity`, { headers: { "x-canvas-agent-token": token }, signal: AbortSignal.timeout(1000) });
        if (!response.ok) return null;
        return await response.json() as Identity;
    } catch {
        return null;
    }
}

function portOccupied(url: string) {
    const target = new URL(url);
    return new Promise<boolean>((resolve) => {
        const socket = net.connect(Number(target.port), target.hostname);
        socket.once("connect", () => { socket.destroy(); resolve(true); });
        socket.once("error", () => resolve(false));
        socket.setTimeout(1000, () => { socket.destroy(); resolve(false); });
    });
}
