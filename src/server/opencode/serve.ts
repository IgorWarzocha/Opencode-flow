/**
 * OpenCode Serve Client manages a shared local opencode serve process.
 * It provides a directory-scoped SDK client for the running server.
 */
// sdk is provided via package.json at runtime
import { createOpencodeClient } from "@opencode-ai/sdk/v2";
import type { Subprocess } from "bun";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4096;
const STARTUP_RETRIES = 12;
const STARTUP_DELAY_MS = 250;
const HEALTHCHECK_TIMEOUT_MS = 1000;

let serveProcess: Subprocess<"pipe", "pipe", "pipe"> | null = null;
let serveBaseUrl = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkServeHealthy = async (baseUrl: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTHCHECK_TIMEOUT_MS);
  const ok = await fetch(`${baseUrl}/doc`, { signal: controller.signal })
    .then((res) => res.ok)
    .catch(() => false);
  clearTimeout(timeout);
  return ok;
};

const spawnServeProcess = () => {
  if (serveProcess && serveProcess.exitCode === null) return;

  serveProcess = Bun.spawn(
    ["opencode", "serve", "--hostname", DEFAULT_HOST, "--port", `${DEFAULT_PORT}`],
    {
      stdout: "pipe",
      stderr: "pipe",
    },
  );
};

const waitForServe = async (baseUrl: string): Promise<boolean> => {
  for (let attempt = 0; attempt < STARTUP_RETRIES; attempt += 1) {
    if (await checkServeHealthy(baseUrl)) return true;
    await wait(STARTUP_DELAY_MS);
  }

  return false;
};

export const ensureServeBaseUrl = async (): Promise<string | null> => {
  if (await checkServeHealthy(serveBaseUrl)) return serveBaseUrl;

  spawnServeProcess();
  const ready = await waitForServe(serveBaseUrl);
  if (!ready) {
    return null;
  }

  return serveBaseUrl;
};

export const getServeClient = async () => {
  const baseUrl = await ensureServeBaseUrl();
  if (!baseUrl) {
    return { client: null, error: "OpenCode serve failed to start." };
  }

  return {
    client: createOpencodeClient({
      baseUrl,
      responseStyle: "fields",
      throwOnError: false,
    }),
    error: null,
  };
};
