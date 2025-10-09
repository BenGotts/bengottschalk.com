import ContactForm from "@/components/forms/ContactForm";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Benjamin Gottschalk',
  description: 'Get in touch with Benjamin Gottschalk for software development projects and consultations.',
}

export default function ContactPage() {
  return (
    <div className="flex-grow bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Let's Work Together
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
            Have a project in mind? Looking for a developer? Send me a message and I'll get back to you as soon as possible.
          </p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <ContactForm />
      </div>

      {/* Additional Contact Info */}
      <div className="container mx-auto max-w-4xl px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <a href="mailto:ben@bengottschalk.com" className="text-blue-600 hover:text-blue-700">
              ben@bengottschalk.com
            </a>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">LinkedIn</h3>
            <a href="https://www.linkedin.com/in/benjgottschalk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
              /in/benjgottschalk
            </a>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">GitHub</h3>
            <a href="https://github.com/BenGotts" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
              @BenGotts
            </a>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Prefer a more detailed proposal?
          </p>
          <a 
            href="/services#proposal-form"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Submit a Project Proposal
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
