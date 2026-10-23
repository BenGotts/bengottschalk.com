import Link from "next/link";
import StickerLogo from "@/components/StickerLogo";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-16 text-center">
      <StickerLogo className="size-16" />
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-lg text-muted">That page doesn&apos;t exist, or it&apos;s been scrambled.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/results" className="btn border-base-300 bg-base-200 hover:border-primary">See results</Link>
      </div>
    </div>
  );
}
