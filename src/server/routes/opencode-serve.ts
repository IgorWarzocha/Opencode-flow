/**
 * OpenCode Serve Routes expose a scoped assistant API for the UI.
 * They proxy opencode serve while keeping Flow's session store separate.
 */
import { getWorkspaceRoot } from "../workspace.ts";
import { getServeClient } from "../opencode/opencode.ts";

type AssistantSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

type AssistantMessage = {
  id: string;
  role: string;
  text: string;
  createdAt: number;
  completedAt: number | null;
  parts: ReadonlyArray<Record<string, unknown>>;
};

type SDKError = {
  name?: string;
  data?: { message?: string };
};

type SDKResult<T> = {
  data?: T;
  error?: SDKError;
};

const unwrapResult = <T>(result: unknown) => {
  if (typeof result !== "object" || result === null) {
    return { data: null, error: "Invalid response from opencode serve." };
  }

  const typed = result as SDKResult<T>;
  if (typed.data !== undefined) {
    return { data: typed.data, error: null };
  }

  if (typed.error) {
    const message = typed.error.data?.message ?? typed.error.name ?? "Unknown opencode error.";
    return { data: null, error: message };
  }

  return { data: null, error: "Unknown opencode response." };
};

const getTimeValue = (value: unknown, key: "created" | "updated" | "completed"): number => {
  if (typeof value !== "object" || value === null) return 0;
  const time = value as Record<string, unknown>;
  const raw = time[key];
  return typeof raw === "number" ? raw : 0;
};

const toAssistantSession = (session: Record<string, unknown>): AssistantSession => {
  const id = typeof session.id === "string" ? session.id : "unknown";
  const title =
    typeof session.title === "string"
      ? session.title
      : typeof session.name === "string"
        ? session.name
        : id;
  const time = session.time as Record<string, unknown> | undefined;
  return {
    id,
    title,
    createdAt: getTimeValue(time, "created"),
    updatedAt: getTimeValue(time, "updated"),
  };
};

const toAssistantMessage = (entry: Record<string, unknown>): AssistantMessage => {
  const info = entry.info as Record<string, unknown> | undefined;
  const parts = entry.parts;
  const normalizedParts = Array.isArray(parts)
    ? parts.filter((part) => typeof part === "object" && part !== null)
    : [];
  const textParts = normalizedParts
    .filter((part) => (part as Record<string, unknown>).type === "text")
    .map((part) => (part as Record<string, unknown>).text)
    .filter((text): text is string => typeof text === "string");

  const time = info?.time as Record<string, unknown> | undefined;
  return {
    id: typeof info?.id === "string" ? info.id : "unknown",
    role: typeof info?.role === "string" ? info.role : "assistant",
    text: textParts.join("\n"),
    createdAt: getTimeValue(time, "created"),
    completedAt: getTimeValue(time, "completed") || null,
    parts: normalizedParts as ReadonlyArray<Record<string, unknown>>,
  };
};

export const opencodeServeRoutes = {
  "/api/opencode/assistant/status": {
    async GET() {
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const result = await client.path.get();
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to reach opencode serve.", { status: 502 });
      }
      return Response.json({
        connected: true,
        directory,
        path: data,
      });
    },
  },
  "/api/opencode/assistant/agents": {
    async GET() {
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const result = await client.app.agents();
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to load agents.", { status: 502 });
      }
      return Response.json(data);
    },
  },
  "/api/opencode/assistant/models": {
    async GET() {
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const result = await client.config.providers();
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to load models.", { status: 502 });
      }
      return Response.json(data);
    },
  },
  "/api/opencode/assistant/sessions": {
    async GET() {
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const result = await client.session.list();
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to load sessions.", { status: 502 });
      }
      const list = Array.isArray(data) ? data : [];
      const mapped = (list as ReadonlyArray<Record<string, unknown>>).map((session) =>
        toAssistantSession(session),
      );
      return Response.json(mapped);
    },
    async POST(req: Request) {
      const body = (await req.json()) as { title?: string };
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const createBody: { title?: string } = {};
      if (body.title) createBody.title = body.title;
      const result = await client.session.create({ body: createBody });
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to create session.", { status: 502 });
      }
      return Response.json(toAssistantSession(data as Record<string, unknown>));
    },
  },
  "/api/opencode/assistant/sessions/:id/messages": {
    async GET(req: Request & { params: { id: string } }) {
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const result = await client.session.messages({
        path: { id: req.params.id },
      });
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to load messages.", { status: 502 });
      }
      const list = Array.isArray(data) ? data : [];
      const mapped = (list as ReadonlyArray<Record<string, unknown>>).map((message) =>
        toAssistantMessage(message),
      );
      return Response.json(mapped);
    },
    async POST(req: Request & { params: { id: string } }) {
      const body = (await req.json()) as {
        text?: string;
        agent?: string;
        model?: { providerID: string; modelID: string };
      };

      if (!body.text || !body.text.trim()) {
        return new Response("Message text is required", { status: 400 });
      }

      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const promptBody: {
        agent?: string;
        model?: { providerID: string; modelID: string };
        parts: { type: "text"; text: string }[];
      } = {
        parts: [{ type: "text", text: body.text }],
      };

      if (body.agent) promptBody.agent = body.agent;
      if (body.model) promptBody.model = body.model;

      const result = await client.session.prompt({
        path: { id: req.params.id },
        body: promptBody,
      });

      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to send prompt.", { status: 502 });
      }

      return Response.json(toAssistantMessage(data as Record<string, unknown>));
    },
  },
  "/api/opencode/assistant/events": {
    async GET() {
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient(directory);

      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }

      const result = await client.event.subscribe();

      // SSE results have a different shape - check for stream property directly
      if (!result || typeof result !== "object" || !("stream" in result)) {
        return new Response("Failed to subscribe to events.", { status: 502 });
      }

      const eventStream = result.stream as AsyncIterable<unknown>;

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const event of eventStream) {
              const payload = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(payload));
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
  },
};
