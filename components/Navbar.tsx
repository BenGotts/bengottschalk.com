import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* BRAND LOGO WITH INTERACTIVE ICON HOVER */}
        <Link 
          href="/" 
          className="group text-xl font-black text-sky-400 tracking-tight flex items-center gap-2"
        >
          {/* ICON CONTAINER */}
          <div className="relative w-6 h-6 flex items-center justify-center">
            {/* Primary Main Icon: Square-1 (Default Visible) */}
            <span className="cubing-icon event-sq1 text-cyan-400 text-xl absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 group-hover:rotate-12 flex items-center justify-center"></span>
            
            {/* Secondary Icon: 3x3 (Reveals on Hover) */}
            <span className="cubing-icon event-333 text-emerald-400 text-xl absolute inset-0 opacity-0 scale-75 -rotate-12 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0 flex items-center justify-center"></span>
          </div>

          <span>
            bengottschalk<span className="text-emerald-400">.com</span>
          </span>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex gap-6 font-semibold text-xs tracking-wider">
          <Link href="/" className="text-sky-400 border-b-2 border-sky-400 pb-0.5">HOME</Link>
          <Link href="/cubing" className="hover:text-emerald-400 transition-colors">CUBING</Link>
          <Link href="/tech" className="hover:text-emerald-400 transition-colors">TECH</Link>
          <Link href="/music" className="hover:text-emerald-400 transition-colors">MUSIC</Link>
          <Link href="/content" className="hover:text-emerald-400 transition-colors">CONTENT</Link>
          <Link href="/contact" className="hover:text-emerald-400 transition-colors">CONTACT</Link>
        </nav>

      </div>
    </header>
  );
}