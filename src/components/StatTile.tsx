import Link from "next/link";

interface StatTileProps {
  value: React.ReactNode;
  label: React.ReactNode;
  /** Makes the whole tile a link to the details behind the number. */
  href?: string;
}

export default function StatTile({ value, label, href }: StatTileProps) {
  const content = (
    <>
      <span className="font-display text-4xl font-bold">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </>
  );
  const className = "flex flex-col gap-1.5 rounded-box border border-base-300 bg-base-200 p-5";
  if (!href) return <div className={className}>{content}</div>;
  return (
    <Link href={href} className={`${className} transition-colors hover:border-primary focus-visible:border-primary`}>
      {content}
    </Link>
  );
}
