import { FaLinkedin, FaGithub, FaYoutube, FaFilePdf, FaTiktok } from 'react-icons/fa'

export default function Connect() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-8 text-center" id='Connect'>
      <h2 className="text-3xl font-bold mb-6">Connect With Me</h2>
      <p className="text-lg text-gray-700 mb-4">Feel free to reach out or follow my work on these platforms:</p>
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {/* Resume */}
        <a href="https://resume.bengottschalk.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-700 hover:text-black">
          <FaFilePdf className="w-8 h-8 mb-2" />
          Resume
        </a>
        {/* LinkedIn */}
        <a href="https://www.linkedin.com/in/benjgottschalk" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-blue-700 hover:text-blue-800">
          <FaLinkedin className="w-8 h-8 mb-2" />
          LinkedIn
        </a>
        {/* GitHub */}
        <a href="https://github.com/BenGotts" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-700 hover:text-black">
          <FaGithub className="w-8 h-8 mb-2" />
          GitHub
        </a>
        {/* YouTube */}
        <a href="https://www.youtube.com/c/BenjaminGottschalk" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-red-600 hover:text-red-700">
          <FaYoutube className="w-8 h-8 mb-2" />
          YouTube
        </a>
        {/* TikTok */}
        <a href="https://www.tiktok.com/@bengotts" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-700 hover:text-black">
          <FaTiktok className="w-8 h-8 mb-2" />
          TikTok
        </a>
      </div>
    </section>
  )
}


