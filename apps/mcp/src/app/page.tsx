import { MCP_URL, SITE_NAME, SITE_URL } from "@bengottschalk/content/site";

const ENDPOINT = `${MCP_URL}/mcp`;
const PRIVATE_ENDPOINT = `${MCP_URL}/private`;

const TOOLS = [
  ["get_about", "Who I am and where to find me"],
  ["get_social_links", "My social media and code profiles"],
  ["get_experience", "My work history"],
  ["get_projects", "Software projects I've built"],
  ["get_wca_profile", "My speedcubing competitions, medals and personal records"],
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{SITE_NAME} MCP server</h1>
        <p className="text-muted">
          Connect an AI assistant to this <a className="link" href="https://modelcontextprotocol.io">Model Context Protocol</a>{" "}
          server to ask it about me. Everything it returns is public; see <a className="link" href={SITE_URL}>my website</a>.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Endpoint</h2>
        <p className="text-muted">Add it as a remote MCP server (Streamable HTTP). No sign-in needed.</p>
        <pre className="overflow-x-auto rounded-box bg-base-200 p-4 font-mono text-sm">{ENDPOINT}</pre>
        <p className="text-sm text-muted">
          <code className="font-mono">{PRIVATE_ENDPOINT}</code> has the same tools plus private ones, and is only for me.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Tools</h2>
        <ul className="divide-y divide-base-300 rounded-box border border-base-300">
          {TOOLS.map(([name, description]) => (
            <li key={name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
              <code className="font-mono text-primary sm:w-44 sm:shrink-0">{name}</code>
              <span className="text-muted">{description}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
