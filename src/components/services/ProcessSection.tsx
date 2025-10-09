interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

const processSteps: ProcessStep[] = [
  {
    step: '1',
    title: 'Initial Consultation',
    description: 'We discuss your project requirements, goals, and timeline in a free consultation call.'
  },
  {
    step: '2',
    title: 'Proposal & Planning',
    description: 'Receive a detailed proposal with project scope, timeline, and pricing. We refine the plan together.'
  },
  {
    step: '3',
    title: 'Development',
    description: 'Regular updates and check-ins as your project comes to life. Review progress at key milestones.'
  },
  {
    step: '4',
    title: 'Launch & Support',
    description: 'Thorough testing, deployment, and training. Ongoing support to ensure everything runs smoothly.'
  }
]

export default function ProcessSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            A straightforward process designed to bring your project to life efficiently and effectively.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {processSteps.map((item, index) => (
            <div key={index} className="relative text-center group">
              <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                {item.step}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
              </div>
              {index < processSteps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300"></div>
              )}
              <h3 className="text-xl font-bold mb-3 text-gray-800">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


