import { Badge } from '@/components/ui/badge'

const companies = [
  {
    name: 'Marchex',
    role: 'Software Development Engineer',
    period: '2022 - 2023',
    technologies: ['Node.js', 'Python', 'AWS', 'SQL']
  },
  {
    name: 'Intel',
    role: 'Software Development Engineer in Test',
    period: '2022',
    technologies: ['C#', 'Python', 'Jenkins', 'Automation']
  },
  {
    name: 'Pour Soul Systems',
    role: 'Software Developer',
    period: '2020 - 2021',
    technologies: ['Flutter', 'DynamoDB', 'BLoC', 'Agile']
  }
]

export default function Experience() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Professional Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Proven track record delivering high-quality software solutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {companies.map((company, index) => (
            <div key={index} className="group">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-gray-700 font-medium mb-1">{company.role}</p>
                  <p className="text-sm text-gray-500">{company.period}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.technologies.map((tech, techIndex) => (
                    <Badge key={techIndex} className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a 
            href="https://resume.bengottschalk.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg group"
          >
            View Full Resume
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

