import Link from "next/link";
import ScrambleCube from "@/components/ScrambleCube";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-16 text-center">
      <ScrambleCube
        rowClassName="my-6 flex items-center gap-6 font-display text-8xl font-bold leading-none sm:gap-10 sm:text-9xl"
        before={<span>4</span>}
        after={<span>4</span>}
      />
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-lg text-muted">That page doesn&apos;t exist, or it&apos;s been scrambled.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/cubing" className="btn border-base-300 bg-base-200 hover:border-primary">Cubing</Link>
      </div>
    </div>
  );
}
