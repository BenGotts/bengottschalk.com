import React from 'react'
import { Metadata } from 'next'
import ServicesHero from '@/components/services/ServicesHero'
import ServicesOverview from '@/components/services/ServicesOverview'
import ProcessSection from '@/components/services/ProcessSection'
import TechnologiesSection from '@/components/services/TechnologiesSection'
import CTASection from '@/components/services/CTASection'
import ProposalForm from '@/components/forms/ProposalForm'
import FAQSection from '@/components/services/FAQSection'
import QuickProposalCTA from '@/components/services/QuickProposalCTA'

export const metadata: Metadata = {
  title: 'Services | Benjamin Gottschalk',
  description: 'Professional software development services - web applications, cloud infrastructure, AI/ML integration, and more.',
}

export default function Services() {
  return (
    <div className="flex flex-grow flex-col min-h-screen">
      <ServicesHero />
      <ServicesOverview />
      <ProcessSection />
      <TechnologiesSection />
      
      {/* Proposal Form Section */}
      <section id="proposal-form" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50 scroll-mt-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Submit Your Project Proposal
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to get started? Fill out the form below with your project details and I'll get back to you within 24-48 hours.
            </p>
          </div>
          <ProposalForm />
        </div>
      </section>

      <FAQSection />
      <CTASection />
      
      {/* Floating CTA Button */}
      <QuickProposalCTA />
    </div>
  )
}