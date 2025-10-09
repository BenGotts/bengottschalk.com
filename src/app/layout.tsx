import './globals.css'
import { Providers } from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Benjamin Gottschalk | Full-Stack Software Engineer & WCA Delegate',
  description: 'Professional software development services and WCA Delegate. Full-stack engineer specializing in web applications, cloud infrastructure, and AI/ML integration. Organizing international speedcubing competitions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <link rel='icon' href='/bg.svg' sizes='any' />
      <body className="antialiased">
        <Providers>
          <div className='flex flex-col min-h-screen'>
            <Header />
            <main className='flex flex-grow flex-col'>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
