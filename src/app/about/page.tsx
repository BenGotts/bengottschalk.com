import AboutMe from "@/components/about/AboutMe";
import Connect from "@/components/about/Connect";
import Experience from "@/components/about/Experience";
import HobbiesInterests from "@/components/about/HobbiesInterests";
import MyProjects from "@/components/about/MyProjects";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Me | bengottschalk.com',
  description: 'Learn more about Benjamin Gottschalk and how to connect with him.',
}

export default function About() {
  return (
    <div className="p-4 flex-grow">
      <AboutMe />
      <HobbiesInterests />
      <Experience />
      <MyProjects />
      <Connect />
    </div>
  )
}


