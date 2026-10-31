import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-muted">This MCP server's private tools are only for Ben.</p>
      </header>
      <LoginForm error={typeof error === "string" ? error : undefined} devPasswordSignIn={process.env.NODE_ENV === "development"} />
    </main>
  );
}
