import type { McpServer } from "@modelcontextprotocol/server";
import { experience } from "@bengottschalk/content/experience";
import { formatDateSpan } from "@bengottschalk/content/dates";
import { SOCIAL_LINKS, WCA_PROFILE_URL } from "@bengottschalk/content/links";
import { projects } from "@bengottschalk/content/projects";
import { LINKS_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@bengottschalk/content/site";
import { getWcaProfile } from "@/lib/wca";

// Every tool only reads public information.
const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

export function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

/** Read-only tools about Ben, served to anyone on /mcp and to the owner on /private. */
export function registerPublicTools(server: McpServer) {
  server.registerTool(
    "get_about",
    {
      title: "About Ben Gottschalk",
      description: "Who Ben Gottschalk is, his current role, and where to find him online.",
      annotations: READ_ONLY,
    },
    () => {
      const [current] = experience;
      return json({
        name: SITE_NAME,
        summary: SITE_DESCRIPTION,
        currentRole: current ? `${current.title} at ${current.company}` : null,
        website: SITE_URL,
        links: LINKS_URL,
        contact: `${SITE_URL}/contact`,
        wcaProfile: WCA_PROFILE_URL,
      });
    },
  );

  server.registerTool(
    "get_social_links",
    {
      title: "Social links",
      description: "Ben Gottschalk's social media and code profiles.",
      annotations: READ_ONLY,
    },
    () => json(SOCIAL_LINKS.map(({ label, href }) => ({ label, url: href }))),
  );

  server.registerTool(
    "get_experience",
    {
      title: "Work experience",
      description: "Ben Gottschalk's work history, newest first.",
      annotations: READ_ONLY,
    },
    () =>
      json(
        experience.map(({ title, company, details, ...span }) => ({
          title,
          company,
          dates: formatDateSpan(span),
          details,
        })),
      ),
  );

  server.registerTool(
    "get_projects",
    {
      title: "Projects",
      description: "Software projects Ben Gottschalk has built, newest first.",
      annotations: READ_ONLY,
    },
    () =>
      json(
        projects.map(({ title, technologies, details, githubLink, projectLink, ...span }) => ({
          title,
          dates: formatDateSpan(span),
          technologies,
          details,
          github: githubLink,
          url: projectLink ?? null,
        })),
      ),
  );

  server.registerTool(
    "get_wca_profile",
    {
      title: "Speedcubing profile",
      description:
        "Ben Gottschalk's World Cube Association profile: competitions, medals, records, and personal records with world, continent and country ranks for each event.",
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    async () => json(await getWcaProfile()),
  );
}
