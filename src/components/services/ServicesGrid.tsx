import ServiceCard from './ServiceCard'
import { serviceCategories } from '@/data/services'

export default function ServicesGrid() {
  return (
    <section id="services" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Services Offered
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Professional software development services tailored to your unique needs. Let's build something amazing together.
          </p>
        </div>

        {serviceCategories.map((category, categoryIndex) => (
          <div 
            key={categoryIndex} 
            id={category.category.toLowerCase().replace(/\s+&?\s*/g, '-')}
            className="mb-20 last:mb-0 scroll-mt-24"
          >
            <div className="flex items-center justify-center mb-10">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent flex-grow max-w-xs"></div>
              <h3 className="text-2xl md:text-3xl font-bold mx-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {category.category}
              </h3>
              <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent flex-grow max-w-xs"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {category.services.map((service, serviceIndex) => (
                <ServiceCard key={serviceIndex} service={service} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


