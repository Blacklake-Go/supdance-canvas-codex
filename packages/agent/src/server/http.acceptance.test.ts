import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { VERSION } from "../config.js";

const origin = "https://canvas.supdance.com";

test("local Agent identity and one-use SSE tickets enforce version, origin, and client", { timeout: 15_000 }, async (t) => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "supdance-agent-acceptance-"));
    const configDir = path.join(home, ".supdance-canvas");
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    const port = await unusedPort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const token = "acceptance-only-agent-token";
    fs.writeFileSync(path.join(configDir, "canvas-agent.json"), JSON.stringify({
        url: baseUrl,
        token,
        origins: [origin],
    }), { mode: 0o600 });

    const packageRoot = process.cwd();
    const child = spawn(process.execPath, [
        path.join(packageRoot, "node_modules/tsx/dist/cli.mjs"),
        path.join(packageRoot, "src/index.ts"),
    ], {
        cwd: packageRoot,
        env: { ...process.env, HOME: home, USERPROFILE: home, PORT: String(port) },
        stdio: "ignore",
    });
    t.after(async () => {
        await stop(child);
        fs.rmSync(home, { recursive: true, force: true });
    });

    const identity = await waitForIdentity(baseUrl, token);
    assert.equal(identity.service, "supdance-canvas-agent");
    assert.equal(identity.agentVersion, VERSION);
    assert.equal(identity.protocolVersion, 6);

    const queryTokenResponse = await fetch(`${baseUrl}/identity?token=acceptance-only-agent-token`);
    assert.equal(queryTokenResponse.status, 401, "the long-lived token must not authorize through a URL query");

    const originTicket = await issueTicket(baseUrl, token, "origin-bound-client");
    const wrongOrigin = await getEvents(baseUrl, originTicket, "origin-bound-client", "https://evil.example");
    assert.equal(wrongOrigin.status, 403);
    const acceptedOrigin = await getEvents(baseUrl, originTicket, "origin-bound-client", origin);
    assert.equal(acceptedOrigin.status, 200);
    await acceptedOrigin.body?.cancel();

    const clientTicket = await issueTicket(baseUrl, token, "bound-client");
    const wrongClient = await getEvents(baseUrl, clientTicket, "other-client", origin);
    assert.equal(wrongClient.status, 401);
    const replayedClientTicket = await getEvents(baseUrl, clientTicket, "bound-client", origin);
    assert.equal(replayedClientTicket.status, 401, "a failed client-binding attempt must consume the one-use ticket");

    const replayTicket = await issueTicket(baseUrl, token, "single-use-client");
    const firstUse = await getEvents(baseUrl, replayTicket, "single-use-client", origin);
    assert.equal(firstUse.status, 200);
    await firstUse.body?.cancel();
    const secondUse = await getEvents(baseUrl, replayTicket, "single-use-client", origin);
    assert.equal(secondUse.status, 401, "a successful SSE ticket must not be reusable");

    for (const mode of ["new", "recent", "choose"] as const) {
        const page = await launchPage(baseUrl, token, { mode });
        assert.equal(page.pathname, "/canvas");
        assert.equal(page.searchParams.get("mode"), mode);
        assert.equal(page.searchParams.has("projectId"), false);
        assert.equal(page.searchParams.has("agentToken"), false);
        assert.equal(page.searchParams.has("token"), false);
        assertLaunchFragment(page, baseUrl, token);
    }

    const selectedPage = await launchPage(baseUrl, token, { projectId: "canvas_123" });
    assert.equal(selectedPage.pathname, "/canvas/canvas_123");
    assert.equal(selectedPage.search, "");
    assertLaunchFragment(selectedPage, baseUrl, token);
});

async function unusedPort() {
    const server = net.createServer();
    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const port = address.port;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    return port;
}

async function waitForIdentity(baseUrl: string, token: string) {
    for (let attempt = 0; attempt < 50; attempt++) {
        try {
            const response = await fetch(`${baseUrl}/identity`, { headers: { "x-canvas-agent-token": token } });
            if (response.ok) return await response.json() as Record<string, unknown>;
        } catch {
            // The child has not bound its port yet.
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("SupDance Canvas Agent did not become ready for acceptance");
}

async function issueTicket(baseUrl: string, token: string, clientId: string) {
    const response = await fetch(`${baseUrl}/events-ticket`, {
        method: "POST",
        headers: { "content-type": "application/json", origin, "x-canvas-agent-token": token },
        body: JSON.stringify({ clientId }),
    });
    assert.equal(response.status, 200);
    const data = await response.json() as { ticket?: string };
    assert.ok(data.ticket);
    return data.ticket;
}

async function launchPage(baseUrl: string, token: string, target: { mode?: "new" | "recent" | "choose"; projectId?: string }) {
    const response = await fetch(`${baseUrl}/launch`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-canvas-agent-token": token },
        body: JSON.stringify(target),
    });
    assert.equal(response.status, 200);
    const data = await response.json() as { url?: string };
    assert.ok(data.url);
    const redirect = await fetch(data.url, { redirect: "manual" });
    assert.equal(redirect.status, 302);
    const location = redirect.headers.get("location");
    assert.ok(location);
    return new URL(location);
}

function assertLaunchFragment(page: URL, baseUrl: string, token: string) {
    const bootstrap = new URLSearchParams(page.hash.slice(1));
    assert.equal(bootstrap.get("agentUrl"), baseUrl);
    assert.equal(bootstrap.get("agentToken"), token);
    assert.equal(page.searchParams.has("agentToken"), false);
    assert.equal(page.searchParams.has("token"), false);
}

function getEvents(baseUrl: string, ticket: string, clientId: string, requestOrigin: string) {
    const url = new URL(`${baseUrl}/events`);
    url.searchParams.set("ticket", ticket);
    url.searchParams.set("clientId", clientId);
    return fetch(url, { headers: { accept: "text/event-stream", origin: requestOrigin } });
}

async function stop(child: ChildProcess) {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2_000))]);
}
