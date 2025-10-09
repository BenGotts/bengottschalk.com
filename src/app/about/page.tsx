import AboutMe from "@/components/about/AboutMe";
import Connect from "@/components/about/Connect";
import Experience from "@/components/about/Experience";
import HobbiesInterests from "@/components/about/HobbiesInterests";
import MyProjects from "@/components/about/MyProjects";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Benjamin Gottschalk',
  description: 'Learn more about Benjamin Gottschalk - Full-Stack Software Engineer, competitive speedcuber, and musician.',
}

export default function About() {
  return (
    <div className="flex-grow bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About Me
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Software engineer, WCA Delegate, competitive speedcuber, musician, and lifelong learner
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <AboutMe />
        <HobbiesInterests />
        <Experience />
        <MyProjects />
        <Connect />
      </div>
    </div>
  )
}
