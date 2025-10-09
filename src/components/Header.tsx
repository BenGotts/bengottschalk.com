'use client'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

interface MenuItem {
  name: string;
  href: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems: MenuItem[] = [
    {
      name: "Home",
      href: "/"
    },
    {
      name: "Competitions",
      href: "/competitions"
    },
    {
      name: "WCA",
      href: "https://wca.bengottschalk.com"
    },
    {
      name: "Projects",
      href: "https://github.com/BenGotts?tab=repositories"
    },
    {
      name: "Services",
      href: "/services"
    },
    {
      name: "About",
      href: "/about"
    },
    {
      name: "Contact",
      href: "/contact"
    },
    {
      name: "Donate",
      href: "https://ko-fi.com/bengottschalk"
    },
  ]

  return (
    <header className="bg-blue-600 sticky top-0 z-50 border-b border-blue-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-white text-2xl font-bold hover:text-blue-200 transition-colors">
              Ben Gottschalk
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-blue-200 transition-colors">Home</Link>
            <Link href="/competitions" className="text-white hover:text-blue-200 transition-colors">Competitions</Link>
            <Link href="https://wca.bengottschalk.com" target="_blank" className="text-white hover:text-blue-200 transition-colors">WCA</Link>
            <Link href="https://github.com/BenGotts?tab=repositories" target="_blank" className="text-white hover:text-blue-200 transition-colors">Projects</Link>
            <Link href="/services" className="text-white hover:text-blue-200 transition-colors">Services</Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-700 hover:text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden border-t border-blue-700">
            <nav className="py-4 space-y-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block px-4 py-2 text-white hover:bg-blue-700 hover:text-white transition-colors rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}


