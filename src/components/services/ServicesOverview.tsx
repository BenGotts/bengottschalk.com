'use client'
import React, { useState } from 'react'
import { serviceCategories } from '@/data/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ServicesOverview() {
  const [expandedService, setExpandedService] = useState<string | null>(null)

  const toggleService = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId)
  }

  const categoryIcons = [
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>,
    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>,
    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ]

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Professional Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Click on any category to explore services and pricing. Each service can be expanded to see full details.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {serviceCategories.map((category, categoryIndex) => (
            <div 
              key={categoryIndex} 
              className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all shadow-lg hover:shadow-xl"
            >
              {/* Category Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    {categoryIcons[categoryIndex]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {category.category}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {category.services.length} service{category.services.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
              </div>

              {/* Services List - Always Visible */}
              <div className="p-6 space-y-3">
                {category.services.map((service, serviceIndex) => {
                    const serviceId = `${categoryIndex}-${serviceIndex}`
                    const isExpanded = expandedService === serviceId
                    
                    return (
                      <div 
                        key={serviceIndex}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          isExpanded 
                            ? 'border-blue-400 shadow-lg' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Service Header - Compact */}
                        <button
                          onClick={() => toggleService(serviceId)}
                          className="w-full p-3 text-left hover:bg-blue-50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {service.title}
                                </h4>
                                {service.popular && (
                                  <Badge className="bg-blue-100 text-blue-700 text-xs flex-shrink-0">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {service.priceRange}
                              </p>
                            </div>
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${
                                isExpanded ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* Expanded Service Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-4">
                            {/* Description */}
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {service.description}
                            </p>

                            {/* Features */}
                            <div>
                              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                What's Included
                              </h5>
                              <ul className="space-y-1.5">
                                {service.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs">
                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <span className="text-gray-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 pt-2">
                              <a href="#proposal-form" className="w-full">
                                <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all text-xs">
                                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Submit Proposal
                                </Button>
                              </a>
                              <Link href="/contact" className="w-full">
                                <Button size="sm" variant="outline" className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-xs">
                                  Quick Contact
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Not sure which service you need? Let's discuss your project!
          </p>
          <a href="#proposal-form">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Submit a Detailed Proposal
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
