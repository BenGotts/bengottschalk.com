import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  hoverColor?: "sky" | "emerald" | "cyan" | "blue";
}

export function BentoCard({ children, className = "", hoverColor = "sky" }: BentoCardProps) {
  const hoverBorders = {
    sky: "hover:border-sky-500",
    emerald: "hover:border-emerald-500",
    cyan: "hover:border-cyan-500",
    blue: "hover:border-blue-500",
  };

  return (
    <div className={`bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-colors ${hoverBorders[hoverColor]} ${className}`}>
      {children}
    </div>
  );
}