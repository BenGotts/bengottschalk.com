interface CategoryNavigationProps {
  categories: string[];
}

export default function CategoryNavigation({ categories }: CategoryNavigationProps) {
  return (
    <section className="py-6 px-4 bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-16 z-40 shadow-sm">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category, index) => (
            <a
              key={index}
              href={`#${category.toLowerCase().replace(/\s+&?\s*/g, '-')}`}
              className="group px-6 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-600 hover:to-indigo-600 hover:text-white rounded-full font-medium transition-all duration-300 border border-blue-100 hover:border-transparent hover:shadow-md hover:scale-105"
            >
              {category}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}


