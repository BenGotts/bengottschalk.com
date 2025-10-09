import { FaLinkedin, FaGithub, FaYoutube, FaTiktok, FaDonate } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="sticky bottom-0 bg-blue-600 text-white p-4 z-10">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="text-center md:text-left md:flex-1">
            <p>&copy; {new Date().getFullYear()} Ben Gottschalk</p>
          </div>
          <div className="flex justify-center md:justify-end items-center gap-4 mt-4 md:mt-0">
            <Link href="/about" className="hover:text-gray-300 flex items-center">About</Link>
            <Link href="/contact" className="hover:text-gray-300 flex items-center">Contact</Link>
            <Link href="https://ko-fi.com/bengottschalk" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 flex items-center">
              <FaDonate className="mr-2" /> Donate
            </Link>
            <Link href="https://www.linkedin.com/in/benjgottschalk" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 flex items-center">
              <FaLinkedin />
            </Link>
            <Link href="https://github.com/BenGotts" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 flex items-center">
              <FaGithub />
            </Link>
            <Link href="https://www.youtube.com/c/BenjaminGottschalk" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 flex items-center">
              <FaYoutube />
            </Link>
            <Link href="https://www.tiktok.com/@bengotts" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 flex items-center">
              <FaTiktok />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


