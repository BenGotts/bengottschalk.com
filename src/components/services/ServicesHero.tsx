import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ServicesHero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
      <div className="container mx-auto max-w-6xl text-center relative z-10">
        <div className="inline-block mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
          <span className="text-sm font-medium">🚀 Professional Software Development</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 leading-tight">
          Custom Software<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white">Solutions That Scale</span>
        </h1>
        <p className="text-xl md:text-2xl mb-10 text-blue-50 max-w-3xl mx-auto font-light">
          Transform your ideas into powerful, scalable software solutions. From web applications to mobile apps, I deliver quality code that drives results.
        </p>
        <div className="flex justify-center">
          <Link href="#proposal-form">
            <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 hover:scale-105 transition-transform text-lg px-10 py-6 shadow-xl font-semibold">
              Submit Proposal →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


