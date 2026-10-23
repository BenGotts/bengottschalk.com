interface StatTileProps {
  value: React.ReactNode;
  label: React.ReactNode;
}

export default function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-box border border-base-300 bg-base-200 p-5">
      <span className="font-display text-4xl font-bold">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
