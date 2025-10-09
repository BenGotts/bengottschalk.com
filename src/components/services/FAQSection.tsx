interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How long does a typical project take?',
    answer: 'Project timelines vary based on complexity and scope. A simple website or automation script might take 2-4 weeks, while complex full-stack applications or AI integrations can take 2-6 months. I provide detailed timelines in the proposal phase.'
  },
  {
    question: 'Do you offer ongoing support and maintenance?',
    answer: 'Yes! I offer comprehensive maintenance retainers starting at $500/month, which include system monitoring with Sentry, updates, bug fixes, security patches, and technical support. One-time support and consulting are also available.'
  },
  {
    question: 'What is your payment structure?',
    answer: 'For project-based work, I typically require a 50% deposit to begin, with the remaining 50% due upon completion. For larger projects, we can arrange milestone-based payments. Ongoing maintenance retainers are billed monthly.'
  },
  {
    question: 'Can you work with my existing development team or infrastructure?',
    answer: 'Absolutely! I\'m experienced in collaborating with existing teams and can integrate seamlessly into your development workflow. I also work with existing cloud infrastructure (AWS, GCP) and can enhance current systems with automation, AI/ML features, or CI/CD pipelines.'
  },
  {
    question: 'What makes your AI/ML services unique?',
    answer: 'With experience from over 39 diverse AI training projects, I bring specialized expertise in LLM fine-tuning, prompt engineering, and practical AI/ML integration into business systems. I focus on delivering tangible, data-driven results rather than just implementing technology for its own sake.'
  },
  {
    question: 'Do you work with startups or only established businesses?',
    answer: 'I work with both! I have specific experience advising startups on technology stacks and technical roadmaps, as well as building robust solutions for established businesses. Whether you\'re launching an MVP or scaling an existing platform, I can help.'
  }
]

export default function FAQSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-200 p-6 transition-all hover:shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">Q</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


