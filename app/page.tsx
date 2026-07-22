import Link from 'next/link';
import {
  getWcaProfile,
  getWcaUserData,
  getWcaCompetitions,
  filterMapCompetitions,
  formatWcaResult
} from '@/lib/wca';
import MapWrapper from '@/components/MapWrapper';

export default async function HomePage() {
  // Fetch real WCA data using your existing helpers
  const profileData = await getWcaProfile();
  const userData = await getWcaUserData();
  const allComps = await getWcaCompetitions();

  // Parse upcoming competitions from the user payload
  const upcomingComps = userData?.user?.upcoming_competitions || [];
  const nextComp = upcomingComps.length > 0 ? upcomingComps[0] : null;

  // Filter map data for the Leaflet component
  const today = new Date().toISOString().split('T')[0];
  const mapComps = filterMapCompetitions(allComps, upcomingComps, today);

  // Extract and format Personal Records
  const prs = profileData?.personal_records || {};
  
  const sq1Single = formatWcaResult(prs?.sq1?.single?.best, 'sq1');
  const sq1Average = formatWcaResult(prs?.sq1?.average?.best, 'sq1', true);
  
  const cube333Single = formatWcaResult(prs?.['333']?.single?.best, '333');
  const cube333Average = formatWcaResult(prs?.['333']?.average?.best, '333', true);

  return (
    <main className="min-h-screen bg-base-100 text-base-content px-4 py-8 md:px-12 lg:px-24 max-w-7xl mx-auto space-y-12">
      
      {/* 1. HERO HEADER */}
      <section className="space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          WCA Delegate & Speedcuber
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Hi, I&apos;m <span className="text-primary">Ben Gottschalk</span>.
        </h1>
        
        <p className="text-lg md:text-xl text-base-content/80 max-w-2xl leading-relaxed">
          I solve Rubik&apos;s cubes fast, delegate WCA competitions across the Pacific Northwest, build modern web applications, and create content.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/cubing" className="btn btn-primary btn-sm rounded-full">🧩 Cubing Hub</Link>
          <Link href="/tech" className="btn btn-outline btn-sm rounded-full">💻 Tech & Code</Link>
          <Link href="/content" className="btn btn-outline btn-sm rounded-full">📹 Daily Content</Link>
          <Link href="/music" className="btn btn-outline btn-sm rounded-full">🎵 Music & Tracks</Link>
        </div>
      </section>

      {/* 2. LIVE WCA STAT TICKER */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-base-200/60 backdrop-blur rounded-2xl border border-base-300">
        <div>
          <p className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">WCA ID</p>
          <p className="text-xl md:text-2xl font-extrabold text-primary">2016GOTT01</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">Gold Medals</p>
          <p className="text-xl md:text-2xl font-extrabold">{profileData?.medals?.gold ?? '48'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">Competitions</p>
          <p className="text-xl md:text-2xl font-extrabold">{profileData?.competition_count ?? '--'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">Square-1 Single</p>
          <p className="text-xl md:text-2xl font-extrabold text-secondary">{sq1Single}</p>
        </div>
      </section>

      {/* 3. CORE SPOTLIGHT: WCA SCORECARD & MAP */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Key Personal Records */}
        <div className="lg:col-span-5 bg-base-200 p-6 rounded-2xl border border-base-300 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🧩</span> Main Events PRs
              </h2>
              <Link href="/cubing" className="text-xs text-primary hover:underline">
                View all events &rarr;
              </Link>
            </div>

            <div className="space-y-4">
              {/* Square-1 Highlight */}
              <div className="p-4 bg-base-100 rounded-xl border border-primary/20 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Square-1</span>
                  <span className="badge badge-accent text-xs">Former NAR</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-base-content/70">Single: <strong className="text-base-content">{sq1Single}</strong></span>
                  <span className="text-base-content/70">Average: <strong className="text-base-content">{sq1Average}</strong></span>
                </div>
              </div>

              {/* 3x3 Highlight */}
              <div className="p-4 bg-base-100 rounded-xl border border-base-300 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">3x3x3 Cube</span>
                  <span className="text-xs text-base-content/60">Official</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-base-content/70">Single: <strong className="text-base-content">{cube333Single}</strong></span>
                  <span className="text-base-content/70">Average: <strong className="text-base-content">{cube333Average}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Competition Banner */}
          {nextComp && (
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-xs uppercase font-bold text-primary tracking-wide">Next Upcoming Comp</p>
              <p className="font-bold text-base mt-1">{nextComp.name}</p>
              <p className="text-xs text-base-content/70">{nextComp.start_date} • {nextComp.city}</p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Competition Map */}
        <div className="lg:col-span-7 bg-base-200 p-6 rounded-2xl border border-base-300 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📍</span> Competition Journey
            </h2>
            <span className="text-xs text-base-content/60">Pacific Northwest Focus</span>
          </div>
          <div className="h-80 w-full rounded-xl overflow-hidden border border-base-300 relative z-0">
            {/* Pass the filtered comps data down to the wrapper */}
            <MapWrapper comps={mapComps} />
          </div>
        </div>
      </section>

      {/* 4. CROSS-DISCIPLINE SHOWCASE (Unchanged) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Beyond Speedcubing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-base-200 p-6 rounded-2xl border border-base-300 hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">💻</div>
              <h3 className="text-lg font-bold">Software & Web Apps</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">Building open-source tools, WCA API utilities, and modern Next.js applications for the community.</p>
            </div>
            <Link href="/tech" className="btn btn-sm btn-ghost justify-start px-0 text-primary mt-4">Explore Tech Portfolio &rarr;</Link>
          </div>
          <div className="bg-base-200 p-6 rounded-2xl border border-base-300 hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary text-xl font-bold">📹</div>
              <h3 className="text-lg font-bold">Daily Content & Shorts</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">Daily 3BLD solves, Square-1 walkthroughs, reconstructions, and speedcubing technique breakdowns.</p>
            </div>
            <Link href="/content" className="btn btn-sm btn-ghost justify-start px-0 text-secondary mt-4">Watch Latest Solves &rarr;</Link>
          </div>
          <div className="bg-base-200 p-6 rounded-2xl border border-base-300 hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-xl font-bold">🎵</div>
              <h3 className="text-lg font-bold">Music & Production</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">Curated playlists for solve sessions, music production projects, and creative tracks.</p>
            </div>
            <Link href="/music" className="btn btn-sm btn-ghost justify-start px-0 text-accent mt-4">Listen & Explore &rarr;</Link>
          </div>
        </div>
      </section>

      <footer className="pt-8 border-t border-base-300 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-base-content/60">
        <p>© {new Date().getFullYear()} Ben Gottschalk. Built with Next.js & Tailwind CSS.</p>
        <div className="flex gap-6">
          <Link href="/cubing" className="hover:text-primary transition-colors">Cubing</Link>
          <Link href="/tech" className="hover:text-primary transition-colors">Tech</Link>
          <Link href="/content" className="hover:text-primary transition-colors">Content</Link>
          <Link href="/music" className="hover:text-primary transition-colors">Music</Link>
        </div>
      </footer>
    </main>
  );
}