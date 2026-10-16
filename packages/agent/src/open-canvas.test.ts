import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { VERSION } from "./config.js";
import { getAgentIdentityError } from "./open-canvas.js";

test("open-canvas explains when a legacy Agent without a version is already running", () => {
    const error = getAgentIdentityError({
        ok: true,
        service: "supdance-canvas-agent",
        protocolVersion: 6,
        url: "http://127.0.0.1:17372",
    }, "http://127.0.0.1:17372");

    assert.match(error || "", /older|legacy/i);
    assert.match(error || "", new RegExp(VERSION.replaceAll(".", "\\.")));
});

test("open-canvas reports the running and expected Agent versions", () => {
    const error = getAgentIdentityError({
        ok: true,
        service: "supdance-canvas-agent",
        agentVersion: "0.1.0",
        protocolVersion: 6,
        url: "http://127.0.0.1:17372",
    }, "http://127.0.0.1:17372");

    assert.match(error || "", new RegExp(`running 0\\.1\\.0, expected ${VERSION.replaceAll(".", "\\.")}`));
});

test("open-canvas reports a protocol mismatch even when the Agent package version matches", () => {
    const error = getAgentIdentityError({
        ok: true,
        service: "supdance-canvas-agent",
        agentVersion: "0.1.1",
        protocolVersion: 5,
        url: "http://127.0.0.1:17372",
    }, "http://127.0.0.1:17372");

    assert.match(error || "", /protocol mismatch.*running 5, expected 6/i);
});

test("open-canvas accepts the expected Agent identity", () => {
    assert.equal(getAgentIdentityError({
        ok: true,
        service: "supdance-canvas-agent",
        agentVersion: "0.1.1",
        protocolVersion: 6,
        url: "http://127.0.0.1:17372",
    }, "http://127.0.0.1:17372"), null);
});

test("open reports an old Agent process instead of silently reusing it", { timeout: 10_000 }, async () => {
    await withIdentityServer({
        ok: true,
        service: "supdance-canvas-agent",
        agentVersion: "0.1.0",
        protocolVersion: 6,
    }, async (url) => {
        const result = await runOpen(url);
        assert.equal(result.code, 1);
        assert.match(result.stderr, /version mismatch.*running 0\.1\.0, expected 0\.1\.1/i);
    });
});

test("open explains when an unrelated service occupies the Agent port", { timeout: 10_000 }, async () => {
    await withIdentityServer(null, async (url) => {
        const result = await runOpen(url);
        assert.equal(result.code, 1);
        assert.match(result.stderr, /port is occupied by another process/i);
    });
});

async function withIdentityServer(identity: Record<string, unknown> | null, run: (url: string) => Promise<void>) {
    const server = http.createServer((request, response) => {
        if (request.url !== "/identity" || !identity) {
            response.writeHead(404).end();
            return;
        }
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ ...identity, url: `http://127.0.0.1:${port}` }));
    });
    const port = await unusedPort();
    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", resolve);
    });
    try {
        await run(`http://127.0.0.1:${port}`);
    } finally {
        await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
}

async function unusedPort() {
    const probe = net.createServer();
    await new Promise<void>((resolve, reject) => {
        probe.once("error", reject);
        probe.listen(0, "127.0.0.1", resolve);
    });
    const address = probe.address();
    assert.ok(address && typeof address !== "string");
    const port = address.port;
    await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
    return port;
}

async function runOpen(url: string) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "supdance-open-agent-test-"));
    const configDir = path.join(home, ".supdance-canvas");
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(configDir, "canvas-agent.json"), JSON.stringify({ url, token: "open-test-token" }), { mode: 0o600 });
    const packageRoot = process.cwd();
    try {
        return await new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
            const child = spawn(process.execPath, [
                path.join(packageRoot, "node_modules/tsx/dist/cli.mjs"),
                path.join(packageRoot, "src/index.ts"),
                "open",
                "--no-browser",
            ], {
                cwd: packageRoot,
                env: { ...process.env, HOME: home, USERPROFILE: home },
                stdio: ["ignore", "ignore", "pipe"],
            });
            let stderr = "";
            child.stderr?.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
            child.once("error", reject);
            child.once("close", (code) => resolve({ code, stderr }));
        });
    } finally {
        fs.rmSync(home, { recursive: true, force: true });
    }
}
