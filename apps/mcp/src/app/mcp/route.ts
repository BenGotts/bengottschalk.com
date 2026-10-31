import { createMcpHandler } from "mcp-handler";
import { PUBLIC_INSTRUCTIONS, SERVER_INFO } from "@/lib/mcp";
import { registerPublicTools } from "@/lib/tools/public";

/** Public, read-only: anyone can connect without signing in. */
const handler = createMcpHandler(registerPublicTools, {
  serverInfo: SERVER_INFO,
  instructions: PUBLIC_INSTRUCTIONS,
});

export { handler as GET, handler as POST, handler as DELETE };
