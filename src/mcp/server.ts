import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createVeniceClient, type ClientEnv } from "../venice/factory";
import { runResearchTool } from "./researchTool";

const server = new McpServer({ name: "obscura-agent", version: "0.1.0" });

server.registerTool(
  "research",
  {
    description:
      "Run a private, autonomous research investigation on Venice and return a sourced dossier. " +
      "Plans, searches and scrapes the web, and leaves no trace.",
    inputSchema: { question: z.string().describe("The research question to investigate") },
  },
  async ({ question }: { question: string }) => {
    const client = createVeniceClient(process.env as ClientEnv);
    const out = await runResearchTool(client, question);
    return { content: [{ type: "text" as const, text: out.text }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Obscura Agent MCP server running on stdio");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
