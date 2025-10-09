import { FaLinkedin, FaGithub, FaYoutube, FaTiktok } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-12 gap-12 py-16">
          {/* Brand Section */}
          <div className="md:col-span-5">
            <h3 className="text-2xl font-bold mb-4">Benjamin Gottschalk</h3>
            <p className="text-blue-200 mb-6 leading-relaxed text-lg">
              Full-Stack Software Engineer & WCA Delegate
            </p>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Building scalable web applications, cloud infrastructure, and AI/ML solutions. 
              Organizing international speedcubing competitions worldwide.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <Link 
                href="https://www.linkedin.com/in/benjgottschalk" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              >
                <FaLinkedin className="w-5 h-5" />
              </Link>
              <Link 
                href="https://github.com/BenGotts" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              >
                <FaGithub className="w-5 h-5" />
              </Link>
              <Link 
                href="https://www.youtube.com/c/BenjaminGottschalk" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-white/10 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              >
                <FaYoutube className="w-5 h-5" />
              </Link>
              <Link 
                href="https://www.tiktok.com/@bengotts" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-white/10 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              >
                <FaTiktok className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h4 className="text-white font-bold mb-4 text-lg">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  About
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="md:col-span-3">
            <h4 className="text-white font-bold mb-4 text-lg">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/services" className="text-gray-300 hover:text-blue-400 transition-colors">
                  View All Services
                </Link>
              </li>
              <li>
                <Link href="/services#proposal-form" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Submit Proposal
                </Link>
              </li>
              <li>
                <a 
                  href="https://wca.bengottschalk.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  WCA Profile
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/BenGotts?tab=repositories" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  GitHub Projects
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <h4 className="text-white font-bold mb-4 text-lg">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:ben@bengottschalk.com" 
                  className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              </li>
              <li>
                <a 
                  href="https://resume.bengottschalk.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resume
                </a>
              </li>
              <li>
                <Link 
                  href="https://ko-fi.com/bengottschalk" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800/50 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Benjamin Gottschalk. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Built with Next.js & TypeScript
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
