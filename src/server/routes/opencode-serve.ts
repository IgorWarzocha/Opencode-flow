/**
 * OpenCode Serve Routes expose a scoped assistant API for the UI.
 * They proxy opencode serve while keeping Flow's session store separate.
 */
import type { Session, Message, Part, TextPart } from "@opencode-ai/sdk/v2";
import { getWorkspaceRoot } from "../workspace.ts";
import { getServeClient } from "../opencode/opencode.ts";
import { createSession as createLocalSession } from "../session/session.ts";

/** DTO returned to the frontend for session info. */
type AssistantSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

/** DTO returned to the frontend for message info. */
type AssistantMessageDTO = {
  id: string;
  role: string;
  text: string;
  createdAt: number;
  completedAt: number | null;
  parts: ReadonlyArray<Part>;
  agent?: string;
  model?: { providerID: string; modelID: string };
};

/** Message list item shape returned by `client.session.messages`. */
type MessageListItem = {
  info: Message;
  parts: Array<Part>;
};

/**
 * SDK response shape from the HeyAPI client.
 * The client returns `{ data, error, request, response }`.
 */
type SDKResponse<TData, TError = unknown> = {
  data: TData | undefined;
  error: TError | undefined;
  request: Request;
  response: Response;
};

/**
 * Unwrap an SDK response into a normalized { data, error } shape.
 * Returns string error messages for UI consumption.
 */
const unwrapResult = <T>(
  result: SDKResponse<T>,
): { data: T; error: null } | { data: null; error: string } => {
  if (result.data !== undefined) {
    return { data: result.data, error: null };
  }

  if (result.error !== undefined) {
    const err = result.error;
    // Handle various SDK error shapes
    if (typeof err === "object" && err !== null) {
      const errorObj = err as { name?: string; data?: { message?: string } };
      const message = errorObj.data?.message ?? errorObj.name ?? "Unknown opencode error.";
      return { data: null, error: message };
    }
    return { data: null, error: String(err) };
  }

  return { data: null, error: "Unknown opencode response." };
};

/**
 * Map an SDK Session to our frontend AssistantSession DTO.
 */
const toAssistantSession = (session: Session): AssistantSession => ({
  id: session.id,
  title: session.title,
  createdAt: session.time.created,
  updatedAt: session.time.updated,
});

/**
 * Map an SDK message list item to our frontend AssistantMessage DTO.
 * Note: SDK v2 provides `agent` and flat `providerID`/`modelID` on assistant messages.
 */
const toAssistantMessage = (entry: MessageListItem): AssistantMessageDTO => {
  const { info, parts } = entry;

  const textParts = parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text);

  const createdAt = info.time.created;
  const completedAt = info.role === "assistant" ? (info.time.completed ?? null) : null;

  const base: AssistantMessageDTO = {
    id: info.id,
    role: info.role,
    text: textParts.join("\n"),
    createdAt,
    completedAt,
    parts,
  };

  // SDK v2 AssistantMessage has flat providerID/modelID, not a nested model object
  if (info.role === "assistant") {
    const assistantInfo = info as Message & {
      agent?: string;
      providerID?: string;
      modelID?: string;
    };
    if (assistantInfo.agent) base.agent = assistantInfo.agent;
    if (assistantInfo.providerID && assistantInfo.modelID) {
      base.model = { providerID: assistantInfo.providerID, modelID: assistantInfo.modelID };
    }
  }

  // UserMessage has a nested model object in SDK v2
  if (info.role === "user") {
    const userInfo = info as Message & {
      model?: { providerID: string; modelID: string };
    };
    if (userInfo.model) base.model = userInfo.model;
  }

  return base;
};

export const opencodeServeRoutes = {
  "/api/opencode/assistant/status": {
    async GET() {
      const directory = getWorkspaceRoot();
      const { client, error: clientError } = await getServeClient();
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
      const { client, error: clientError } = await getServeClient();
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
      const { client, error: clientError } = await getServeClient();
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
      const { client, error: clientError } = await getServeClient();
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const result = await client.session.list();
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to load sessions.", { status: 502 });
      }
      const mapped = data.map(toAssistantSession);
      return Response.json(mapped);
    },
    async POST(req: Request) {
      const body = (await req.json()) as { title?: string; baseBranch?: string };
      const { client, error: clientError } = await getServeClient();
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const createBody: { title?: string } = {};
      if (body.title) createBody.title = body.title;
      const result = await client.session.create({ ...createBody });
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to create session.", { status: 502 });
      }

      // Sync local worktree
      if (data.id) {
        try {
          const options: { id: string; baseBranch?: string } = { id: data.id };
          if (body.baseBranch) options.baseBranch = body.baseBranch;
          await createLocalSession(data.title, {}, options);
        } catch (e) {
          console.error("Failed to create local session worktree:", e);
        }
      }

      return Response.json(toAssistantSession(data));
    },
  },
  "/api/opencode/assistant/sessions/:id/messages": {
    async GET(req: Request & { params: { id: string } }) {
      const { client, error: clientError } = await getServeClient();
      if (!client) {
        return new Response(clientError ?? "OpenCode serve unavailable.", { status: 502 });
      }
      const result = await client.session.messages({
        sessionID: req.params.id,
      });
      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to load messages.", { status: 502 });
      }
      const mapped = data.map(toAssistantMessage);
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

      const { client, error: clientError } = await getServeClient();
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
        sessionID: req.params.id,
        ...promptBody,
      });

      const { data, error } = unwrapResult(result);
      if (error || !data) {
        return new Response(error ?? "Failed to send prompt.", { status: 502 });
      }

      return Response.json(toAssistantMessage(data));
    },
  },
  "/api/opencode/assistant/events": {
    async GET() {
      const { client, error: clientError } = await getServeClient();

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
