import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Service } from '@/data/services'

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="group flex flex-col hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:-translate-y-1 bg-white relative overflow-hidden">
      {service.popular && (
        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16">
          <div className="absolute transform rotate-45 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center shadow-md">
            Popular
          </div>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl leading-tight mb-3 group-hover:text-blue-600 transition-colors">
          {service.title}
        </CardTitle>
        <CardDescription className="text-base text-gray-600 leading-relaxed">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {service.features.map((feature, idx) => (
            <li key={idx} className="flex items-start text-sm">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 pt-6 border-t border-gray-100">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {service.priceRange}
          </span>
        </div>
        <div className="w-full flex flex-col gap-2">
          <Link href="#proposal-form" className="w-full">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
              Submit Proposal →
            </Button>
          </Link>
          <Link href="/contact" className="w-full">
            <Button variant="outline" className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
              Quick Contact
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}


