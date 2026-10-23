import './globals.css'
import { Providers } from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Ben Gottschalk',
  description: 'A website for Ben Gottschalk',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link rel='icon' href='/bg.svg' sizes='any' />
      <body>
        <Providers>
          <div className='flex flex-col min-h-screen'>
            <Header />
            <main className='flex flex-grow'>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
