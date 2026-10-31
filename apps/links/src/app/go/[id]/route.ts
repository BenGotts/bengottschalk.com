import { after, type NextRequest } from "next/server";
import { recordClick } from "@bengottschalk/db/links";
import { deviceFromUserAgent, isCountableClick, sourceFrom } from "@/lib/clicks";
import { getLinks } from "@/lib/data";

/** Counts a click on a links-page button and sends the visitor on to its URL. */
export async function GET(request: NextRequest, { params }: RouteContext<"/go/[id]">) {
  const { id } = await params;
  const { links } = await getLinks();
  const link = links.find((l) => l.id === id);
  // Unknown or removed links go back to the links page.
  if (!link) return Response.redirect(new URL("/", request.url), 302);

  if (isCountableClick(request.headers)) {
    const click = {
      linkId: link.id,
      source: sourceFrom({ src: request.nextUrl.searchParams.get("src") }),
      country: request.headers.get("x-vercel-ip-country"),
      device: deviceFromUserAgent(request.headers.get("user-agent")),
    };
    // Record after the redirect is sent, so the visitor never waits on the database.
    after(() => recordClick(click).catch((error: unknown) => console.error("Couldn't record a click.", error)));
  }

  return new Response(null, { status: 302, headers: { Location: link.url, "Cache-Control": "no-store" } });
}
