import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CTASection() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          Ready to Start Your Project?
        </h2>
        <p className="text-xl md:text-2xl mb-10 text-blue-50 font-light">
          Submit a detailed proposal to get an accurate quote, or reach out for a free consultation.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <a href="#proposal-form">
            <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 hover:scale-105 transition-transform text-lg px-10 py-6 shadow-2xl font-semibold">
              Submit a Proposal →
            </Button>
          </a>
          <Link href="/contact">
            <Button size="lg" className="bg-white/10 text-white border-2 border-white/50 hover:bg-white hover:text-blue-900 px-10 py-6 text-lg backdrop-blur-sm font-semibold transition-all">
              Quick Contact
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


