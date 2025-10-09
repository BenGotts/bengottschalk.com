'use client'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

interface MenuItem {
  name: string;
  href: string;
  external?: boolean;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems: MenuItem[] = [
    {
      name: "Home",
      href: "/"
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
      name: "Competitions",
      href: "/competitions"
    },
    {
      name: "Contact",
      href: "/contact"
    },
  ]

  return (
    <header className="bg-blue-600 sticky top-0 z-50 border-b border-blue-700 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold hover:text-blue-100 transition-colors">
              Benjamin Gottschalk
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems.map((item, index) => (
              <Link 
                key={index}
                href={item.href} 
                className="px-4 py-2 text-white hover:text-blue-100 hover:bg-blue-700 rounded-lg transition-all font-medium"
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
              >
                {item.name}
              </Link>
            ))}
            <Link href="/contact">
              <Button className="ml-4 bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white shadow-lg font-semibold backdrop-blur-sm">
                Get in Touch
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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
          <div className="md:hidden border-t border-blue-700">
            <nav className="py-4 space-y-1">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block px-4 py-2 text-white hover:bg-blue-700 hover:text-blue-100 transition-colors rounded-md font-medium"
                  onClick={() => setIsMenuOpen(false)}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-4 pt-2">
                <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white font-semibold backdrop-blur-sm">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
