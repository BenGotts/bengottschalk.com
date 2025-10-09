'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function QuickProposalCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      const footer = document.querySelector('footer')
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Show button if scrolled down more than 500px
      const shouldShow = scrollY > 500
      
      // Hide button if footer is in viewport
      let hideForFooter = false
      if (footer) {
        const footerTop = footer.getBoundingClientRect().top
        hideForFooter = footerTop < windowHeight
      }
      
      setIsVisible(shouldShow && !hideForFooter)
    }

    window.addEventListener('scroll', toggleVisibility)
    toggleVisibility() // Check on mount
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToProposal = () => {
    document.getElementById('proposal-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <Button
        onClick={scrollToProposal}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl hover:shadow-blue-500/50 px-6 py-6 rounded-full font-semibold flex items-center gap-2 group"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Submit Proposal</span>
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  )
}

