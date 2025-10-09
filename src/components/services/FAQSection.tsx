'use client'
import React, { useState } from 'react'

interface FAQ {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqs: FAQ[] = [
  {
    question: 'How long does a typical project take?',
    answer: 'Project timelines vary based on complexity and scope. A simple website or automation script might take 2-4 weeks, while complex full-stack applications or AI integrations can take 2-6 months. I provide detailed timelines in the proposal phase.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    question: 'Do you offer ongoing support and maintenance?',
    answer: 'Yes! I offer comprehensive maintenance retainers starting at $300/month, which include system monitoring with Sentry, updates, bug fixes, security patches, and technical support. One-time support and consulting are also available.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    question: 'What is your payment structure?',
    answer: 'For project-based work, I typically require a 50% deposit to begin, with the remaining 50% due upon completion. For larger projects, we can arrange milestone-based payments. Ongoing maintenance retainers are billed monthly.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    question: 'Can you work with my existing development team or infrastructure?',
    answer: 'Absolutely! I\'m experienced in collaborating with existing teams and can integrate seamlessly into your development workflow. I also work with existing cloud infrastructure (AWS, GCP) and can enhance current systems with automation, AI/ML features, or CI/CD pipelines.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    question: 'What makes your AI/ML services unique?',
    answer: 'With experience from over 39 diverse AI training projects, I bring specialized expertise in LLM fine-tuning, prompt engineering, and practical AI/ML integration into business systems. I focus on delivering tangible, data-driven results rather than just implementing technology for its own sake.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    question: 'Do you work with startups or only established businesses?',
    answer: 'I work with both! I have specific experience advising startups on technology stacks and technical roadmaps, as well as building robust solutions for established businesses. Whether you\'re launching an MVP or scaling an existing platform, I can help.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
            <span className="text-sm font-semibold text-blue-700">Got Questions?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about my services, process, and pricing
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            
            return (
              <div
                key={index}
                className={`group rounded-xl border-2 overflow-hidden transition-all ${
                  isOpen 
                    ? 'border-blue-400 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50' 
                    : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-6 text-left hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isOpen 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600' 
                        : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                    }`}>
                      {React.cloneElement(faq.icon as React.ReactElement, {
                        className: isOpen ? 'w-6 h-6 text-white' : 'w-6 h-6 text-blue-600'
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className={`text-xl font-bold transition-colors ${
                          isOpen ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          {faq.question}
                        </h3>
                        <svg 
                          className={`w-6 h-6 flex-shrink-0 mt-1 transition-all ${
                            isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6 pt-2">
                    <div className="ml-16 pl-4 border-l-4 border-blue-300">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            I'm happy to discuss your specific needs and answer any questions you might have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#proposal-form">
              <button className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Submit Proposal
              </button>
            </a>
            <a href="/contact">
              <button className="inline-flex items-center gap-2 px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Quick Contact
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
