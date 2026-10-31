import type { Metadata } from "next";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import ConsentForm from "./ConsentForm";

export const metadata: Metadata = { title: "Allow access", robots: { index: false } };

async function clientName(clientId: string) {
  try {
    const client = await getAuth().api.getOAuthClientPublic({ query: { client_id: clientId }, headers: await headers() });
    return client?.client_name ?? null;
  } catch {
    return null;
  }
}

export default async function ConsentPage({ searchParams }: PageProps<"/consent">) {
  const { client_id: clientId } = await searchParams;
  const name = typeof clientId === "string" ? await clientName(clientId) : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Allow access?</h1>
        <p className="text-muted">
          <strong className="text-base-content">{name ?? "An MCP client"}</strong> wants to use your private MCP tools:
          reading and editing the links on links.bengottschalk.com and seeing their clicks.
        </p>
        {typeof clientId === "string" && <p className="break-all text-xs text-muted">Client ID: {clientId}</p>}
      </header>
      <ConsentForm />
    </main>
  );
}
