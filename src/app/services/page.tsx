import React from 'react'
import ServicesHero from '@/components/services/ServicesHero'
import CategoryNavigation from '@/components/services/CategoryNavigation'
import ServicesGrid from '@/components/services/ServicesGrid'
import ProcessSection from '@/components/services/ProcessSection'
import TechnologiesSection from '@/components/services/TechnologiesSection'
import CTASection from '@/components/services/CTASection'
import ProposalForm from '@/components/forms/ProposalForm'
import FAQSection from '@/components/services/FAQSection'
import { serviceCategories } from '@/data/services'

export const metadata = {
  title: 'Services | bengottschalk.com',
  description: 'Custom software development solutions and services offered by Benjamin Gottschalk.',
}

export default function Services() {
  const categoryNames = serviceCategories.map(cat => cat.category)

  return (
    <div className="flex flex-grow flex-col min-h-screen">
      <ServicesHero />
      <CategoryNavigation categories={categoryNames} />
      <ServicesGrid />
      <ProcessSection />
      <TechnologiesSection />
      <CTASection />
      
      {/* Proposal Form Section */}
      <section id="proposal-form" className="py-16 px-4 bg-gray-50 scroll-mt-24">
        <div className="container mx-auto max-w-4xl">
          <ProposalForm />
        </div>
      </section>

      <FAQSection />
    </div>
  )
}