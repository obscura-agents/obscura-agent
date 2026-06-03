import { createVeniceClient } from "../../../venice/factory";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData();
  const audio = form.get("audio");
  const veniceApiKey = form.get("veniceApiKey")?.toString();

  if (!(audio instanceof Blob)) return new Response("Missing 'audio'", { status: 400 });

  let client;
  try {
    client = createVeniceClient(process.env as Record<string, string>, veniceApiKey || undefined);
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }

  try {
    const text = await client.transcribe(audio);
    return Response.json({ text });
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
}
