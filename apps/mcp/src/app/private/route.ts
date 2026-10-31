import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler } from "mcp-handler";
import { getAuth, PRIVATE_MCP_URL } from "@/lib/auth";
import { SERVER_INFO } from "@/lib/mcp";
import { registerLinkTools } from "@/lib/tools/links";
import { registerPublicTools } from "@/lib/tools/public";

const mcpHandler = createMcpHandler(
  (server) => {
    registerPublicTools(server);
    registerLinkTools(server);
  },
  {
    serverInfo: SERVER_INFO,
    instructions:
      "Ben Gottschalk's personal MCP server. Besides public information about Ben, it manages the buttons on " +
      "links.bengottschalk.com (his link in bio) and reports their clicks. Use list_links to find link ids before changing them.",
  },
);

let protectedHandler: ((request: Request) => Promise<Response>) | undefined;

/**
 * Signed-in only. Requests without a valid access token get a 401 that points
 * MCP clients at the OAuth flow, where only the owner can sign in.
 */
function handler(request: Request) {
  protectedHandler ??= requireMcpAuth(getAuth(), mcpHandler, { resource: PRIVATE_MCP_URL });
  return protectedHandler(request);
}

export { handler as GET, handler as POST, handler as DELETE };
