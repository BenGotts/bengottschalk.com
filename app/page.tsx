import Link from "next/link";
import Image from "next/image";
import { BentoCard } from "@/components/BentoCard";
import { formatWcaResult } from "@/lib/wca";

async function getWcaProfile() {
  try {
    const res = await fetch("https://www.worldcubeassociation.org/api/v0/persons/2016gott01", {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch WCA profile", error);
    return null;
  }
}

export default async function Home() {
  const wcaData = await getWcaProfile();

  const sq1Single = wcaData?.personal_records?.sq1?.single;
  const sq1Average = wcaData?.personal_records?.sq1?.average;
  const compCount = wcaData?.competition_count ?? 152;
  const medalTotal = wcaData?.medals?.total ?? 212;
  const avatarUrl = wcaData?.person?.avatar?.thumb_url;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. HERO / BIO (2 Cols Wide) */}
      <BentoCard 
        hoverColor="sky" 
        className="col-span-1 md:col-span-2 lg:col-span-2 justify-between"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-3">
            <span className="text-3xl">👋</span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
              Hi, I&apos;m <span className="text-sky-400">Ben Gottschalk</span>.
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Software Engineer, WCA Regional Delegate, Square-1 Specialist, Trumpeter, and Short-Form Speedcubing Content Creator based in the Pacific Northwest.
            </p>
          </div>

          {avatarUrl && (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-slate-700 shrink-0">
              <Image 
                src={avatarUrl} 
                alt="Benjamin Gottschalk WCA Avatar" 
                fill 
                sizes="(max-width: 640px) 64px, 80px"
                className="object-cover" 
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-6">
          <span className="bg-slate-950 text-slate-300 border border-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-md">
            💻 Software Eng
          </span>
          <span className="bg-slate-950 text-emerald-400 border border-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
            <span className="cubing-icon event-333"></span> WCA Delegate
          </span>
          <span className="bg-slate-950 text-cyan-300 border border-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
            <span className="cubing-icon event-sq1"></span> World #{sq1Single?.world_rank ?? 13} SQ-1
          </span>
          <span className="bg-slate-950 text-slate-300 border border-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-md">
            🎺 Trumpeter
          </span>
        </div>
      </BentoCard>

      {/* 2. DYNAMIC SQUARE-1 SPECIALIST CARD (1 Col Wide) */}
      <BentoCard 
        hoverColor="cyan" 
        className="col-span-1 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 justify-between"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Main Event</span>
          <span className="cubing-icon event-sq1 text-cyan-300 text-3xl"></span>
        </div>

        <div className="my-1 space-y-2">
          <div>
            <div className="text-lg font-black text-white leading-tight">SQUARE-1 SPECIALIST</div>
            <div className="text-xs text-slate-400 mt-0.5">WCA ID: 2016GOTT01</div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-950 p-2 rounded-lg border border-cyan-800/50">
              <div className="text-[10px] text-slate-400 font-bold uppercase">PR Single</div>
              <div className="text-sm font-black text-cyan-300">{formatWcaResult(sq1Single?.best)}</div>
              <div className="text-[9px] text-emerald-400 font-semibold">World #{sq1Single?.world_rank}</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-cyan-800/50">
              <div className="text-[10px] text-slate-400 font-bold uppercase">PR Avg</div>
              <div className="text-sm font-black text-cyan-300">{formatWcaResult(sq1Average?.best)}</div>
              <div className="text-[9px] text-emerald-400 font-semibold">World #{sq1Average?.world_rank}</div>
            </div>
          </div>
        </div>

        <Link href="/content#sq1" className="text-xs font-bold text-cyan-400 hover:underline pt-2 inline-block">
          View Sq1 Solves &rarr;
        </Link>
      </BentoCard>

      {/* 3. DYNAMIC WCA DELEGATE & STATS (1 Col Wide) */}
      <BentoCard hoverColor="emerald" className="col-span-1 justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cubing Leadership</span>
          <span className="cubing-icon event-333 text-emerald-400 text-2xl"></span>
        </div>
        
        <div className="my-1">
          <div className="text-lg font-black text-emerald-400 leading-tight">WCA REGIONAL DELEGATE</div>
          <div className="text-xs text-slate-400 mt-1">Oregon & PNW Competitions</div>
          
          <div className="flex gap-3 mt-3 text-xs font-bold">
            <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-200">
              🏆 <span className="text-emerald-400">{compCount}</span> Comps
            </div>
            <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-200">
              🥇 <span className="text-amber-400">{medalTotal}</span> Medals
            </div>
          </div>
        </div>

        <Link href="/cubing" className="text-xs font-bold text-sky-400 hover:underline pt-2 inline-block">
          Profile & Comps &rarr;
        </Link>
      </BentoCard>

      {/* 4. SOFTWARE ENG (2 Cols Wide) */}
      <BentoCard hoverColor="sky" className="col-span-1 md:col-span-2 lg:col-span-2 justify-between">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engineering</span>
            <h3 className="text-lg font-bold text-white mt-0.5">Full-Stack Development</h3>
          </div>
          <span className="text-xl">💻</span>
        </div>

        <div className="flex flex-wrap gap-1.5 my-3">
          <span className="bg-slate-950 border border-slate-800 text-sky-300 text-[11px] font-semibold px-2.5 py-1 rounded">Next.js</span>
          <span className="bg-slate-950 border border-slate-800 text-sky-300 text-[11px] font-semibold px-2.5 py-1 rounded">Tailwind v4</span>
          <span className="bg-slate-950 border border-slate-800 text-sky-300 text-[11px] font-semibold px-2.5 py-1 rounded">DaisyUI 5</span>
          <span className="bg-slate-950 border border-slate-800 text-sky-300 text-[11px] font-semibold px-2.5 py-1 rounded">WCA API Integration</span>
        </div>

        <Link href="/tech" className="text-xs font-bold text-sky-400 hover:underline">
          Explore Projects & Repos &rarr;
        </Link>
      </BentoCard>

      {/* 5. SOLVE OF THE DAY (1 Col Wide) */}
      <BentoCard hoverColor="cyan" className="col-span-1 justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Series</span>
            <span className="text-xl">📹</span>
          </div>
          <h3 className="text-base font-bold text-white mb-0.5">Solve of the Day</h3>
          <p className="text-xs text-slate-400 mb-3">1K+ Followers on YouTube & TikTok</p>

          <div className="space-y-1.5 mb-4">
            <div className="bg-slate-950 p-2 rounded-lg border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="cubing-icon event-sq1 text-sm text-cyan-400"></span> Square-1
              </span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1 rounded border border-cyan-800">MAIN</span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="cubing-icon event-333 text-sm text-sky-400"></span> 3x3x3
              </span>
              <span className="text-[9px] text-slate-500 font-normal">Recons</span>
            </div>
          </div>
        </div>

        <Link href="/content" className="btn btn-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold border-none w-full rounded-md">
          Watch Shorts &rarr;
        </Link>
      </BentoCard>

      {/* 6. MUSIC ENSEMBLES (1 Col Wide) */}
      <BentoCard hoverColor="blue" className="col-span-1 justify-between">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Music</span>
          <span className="text-xl">🎺</span>
        </div>
        <div className="my-2 space-y-1">
          <div className="text-xs font-bold text-white">Hillsboro Symphony</div>
          <div className="text-xs font-bold text-emerald-400">One More Time Band</div>
        </div>
        <Link href="/music" className="text-xs font-bold text-sky-400 hover:underline pt-1 inline-block">
          Concerts & Media &rarr;
        </Link>
      </BentoCard>

      {/* 7. QUICK CONTACT BANNER (4 Cols Wide) */}
      <BentoCard hoverColor="emerald" className="col-span-1 md:col-span-2 lg:col-span-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Get In Touch</span>
            <span className="text-base">✉️</span>
          </div>
          <div className="text-base md:text-lg font-black text-white">
            Have a software project, WCA competition inquiry, or trumpet performance booking?
          </div>
        </div>
        <Link href="/contact" className="btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none px-6 rounded-lg shrink-0">
          Contact Page &rarr;
        </Link>
      </BentoCard>

    </div>
  );
}