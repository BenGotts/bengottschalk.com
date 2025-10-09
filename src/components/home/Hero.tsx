import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-32 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Benjamin Gottschalk
          </h1>
          
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
              <span className="text-sm font-medium text-blue-200">Full-Stack Software Engineer</span>
            </div>
            <div className="inline-block px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
              <span className="text-sm font-medium text-green-200">WCA Delegate</span>
            </div>
          </div>
          
          <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed max-w-3xl">
            Building scalable software solutions from concept to deployment. Specialized in full-stack development, 
            cloud infrastructure, and AI/ML integration. Also serving as a World Cube Association Delegate, organizing 
            and officiating international speedcubing competitions.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <div className="flex items-center gap-2 text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>B.S. Computer Science, OSU</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>3+ Years Dev Experience</span>
            </div>
            <div className="flex items-center gap-2 text-green-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>WCA Delegate</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Available for Projects</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/services">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-semibold">
                View Services →
              </Button>
            </Link>
            <Link href="/competitions">
              <Button size="lg" className="bg-green-600 text-white hover:bg-green-700 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-semibold">
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                My Competitions
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="bg-white/10 text-white border-2 border-white/50 hover:bg-white hover:text-blue-900 px-8 py-6 text-lg backdrop-blur-sm font-semibold transition-all">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

