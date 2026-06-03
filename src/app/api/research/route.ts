import { createVeniceClient } from "../../../venice/factory";
import { runResearchSession, type ResearchEvent } from "../../../agent/session";

// Node.js is the default runtime in Next.js 16; no explicit `runtime` export needed.
// Route Handlers are not cached by default, which is what we want for a live stream.

export async function POST(req: Request): Promise<Response> {
  const { question, veniceApiKey } = (await req.json()) as {
    question?: string;
    veniceApiKey?: string;
  };
  if (!question) return new Response("Missing 'question'", { status: 400 });

  let client;
  try {
    // BYOK: a user-supplied key (sent per request, never stored) overrides platform config.
    client = createVeniceClient(process.env as Record<string, string>, veniceApiKey);
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ResearchEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        await runResearchSession({
          client,
          question,
          emit: send,
          withVerify: true,
          withVault: true,
          withBriefing: true,
        });
      } catch (err) {
        send({ type: "status", message: `Error: ${(err as Error).message}` });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
