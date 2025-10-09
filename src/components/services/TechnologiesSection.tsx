import { Badge } from '@/components/ui/badge'
import { ReactNode } from 'react';

interface Technology {
  name: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
  icon: ReactNode;
  items: string[];
}

const technologies: Record<string, Technology> = {
  frontend: {
    name: 'Frontend',
    color: 'blue',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    items: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS']
  },
  backend: {
    name: 'Backend & API',
    color: 'purple',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    items: ['Node.js', 'Python', 'C#', 'GraphQL', 'REST API', 'Directus']
  },
  database: {
    name: 'Database',
    color: 'green',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    items: ['PostgreSQL', 'MongoDB', 'Firestore', 'SQL', 'NoSQL']
  },
  cloud: {
    name: 'Cloud & DevOps',
    color: 'orange',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    items: ['AWS EC2', 'AWS Lambda', 'GCP', 'GitHub Actions', 'Jenkins', 'Sentry', 'Docker']
  }
}

interface ColorClasses {
  bg: string;
  border: string;
  iconBg: string;
  badgeText: string;
  badgeBorder: string;
  badgeHover: string;
}

const colorClasses: Record<string, ColorClasses> = {
  blue: {
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
    iconBg: 'from-blue-600 to-indigo-600',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    badgeHover: 'hover:bg-blue-600'
  },
  purple: {
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-100',
    iconBg: 'from-purple-600 to-pink-600',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    badgeHover: 'hover:bg-purple-600'
  },
  green: {
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-100',
    iconBg: 'from-green-600 to-emerald-600',
    badgeText: 'text-green-700',
    badgeBorder: 'border-green-200',
    badgeHover: 'hover:bg-green-600'
  },
  orange: {
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-100',
    iconBg: 'from-orange-600 to-amber-600',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    badgeHover: 'hover:bg-orange-600'
  }
}

export default function TechnologiesSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Technologies & Tools
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-8">
            Modern, proven technologies to build fast, secure, and scalable applications.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(technologies).map(([key, tech]) => {
            const colors = colorClasses[tech.color]
            return (
              <div key={key} className={`bg-gradient-to-br ${colors.bg} p-6 rounded-2xl border ${colors.border} hover:shadow-lg transition-shadow`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  {tech.icon}
                </div>
                <h4 className="font-bold text-lg mb-4 text-gray-800">{tech.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {tech.items.map((item, index) => (
                    <Badge 
                      key={index} 
                      className={`bg-white ${colors.badgeText} border ${colors.badgeBorder} ${colors.badgeHover} hover:text-white transition-colors text-sm px-3 py-1`}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-bold text-xl ml-4 text-gray-800">Mobile & AI/ML</h4>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['React Native', 'Expo', 'Flutter', 'AI/ML Integration', 'LLM Fine-tuning', 'Prompt Engineering'].map((tech, index) => (
              <Badge key={index} className="bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors text-sm px-4 py-2">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


