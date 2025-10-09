import { FaLinkedin, FaGithub, FaYoutube, FaTiktok } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-white text-2xl font-bold mb-3">Benjamin Gottschalk</h3>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Full-Stack Software Engineer & WCA Delegate specializing in scalable web applications, 
              cloud infrastructure, and AI/ML integration. Organizing international speedcubing competitions worldwide.
            </p>
            <div className="flex gap-4">
              <Link href="https://www.linkedin.com/in/benjgottschalk" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <FaLinkedin className="w-6 h-6" />
              </Link>
              <Link href="https://github.com/BenGotts" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <FaGithub className="w-6 h-6" />
              </Link>
              <Link href="https://www.youtube.com/c/BenjaminGottschalk" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <FaYoutube className="w-6 h-6" />
              </Link>
              <Link href="https://www.tiktok.com/@bengotts" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <FaTiktok className="w-6 h-6" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/services" className="hover:text-blue-400 transition-colors">Services</Link></li>
              <li><Link href="/about" className="hover:text-blue-400 transition-colors">About</Link></li>
              <li><Link href="/competitions" className="hover:text-blue-400 transition-colors">Competitions</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><Link href="/services#web-application-development" className="hover:text-blue-400 transition-colors">Web Development</Link></li>
              <li><Link href="/services#custom-software-automation" className="hover:text-blue-400 transition-colors">Backend & API</Link></li>
              <li><Link href="/services#cloud-devops" className="hover:text-blue-400 transition-colors">Cloud & DevOps</Link></li>
              <li><a href="https://resume.bengottschalk.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Resume</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Benjamin Gottschalk. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/contact" className="hover:text-blue-400 transition-colors">Get in Touch</Link>
            <Link href="https://ko-fi.com/bengottschalk" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              Support My Work
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
