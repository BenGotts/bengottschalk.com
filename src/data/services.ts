export interface Service {
  title: string;
  description: string;
  features: string[];
  popular: boolean;
  priceRange: string;
}

export interface ServiceCategory {
  category: string;
  services: Service[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    category: 'Web & Application Development',
    services: [
      {
        title: 'Custom Website Design & Development',
        description: 'Creating modern, responsive, and performance-optimized websites for small businesses and professionals using technologies like Next.js and React.js.',
        features: [
          'Modern Next.js & React.js development',
          'Fully responsive design',
          'Performance optimized',
          'SEO-friendly architecture',
          'Professional UI/UX design'
        ],
        popular: true,
        priceRange: 'Starting at $2,500'
      },
      {
        title: 'Full-Stack Web Application Development',
        description: 'Building complex, data-driven web applications from concept to deployment, handling everything from the user interface to the server-side logic and database.',
        features: [
          'End-to-end development',
          'User interface design',
          'Server-side logic',
          'Database architecture',
          'Complete deployment'
        ],
        popular: true,
        priceRange: 'Starting at $5,000'
      },
      {
        title: 'E-commerce Solutions',
        description: 'Developing online stores with secure payment gateways, product management, and order processing functionalities.',
        features: [
          'Secure payment gateway integration',
          'Product management system',
          'Order processing & tracking',
          'Customer account management',
          'Inventory management'
        ],
        popular: false,
        priceRange: 'Starting at $4,500'
      },
      {
        title: 'Mobile App Development',
        description: 'Crafting cross-platform mobile applications for iOS and Android using frameworks like React Native, Expo, and Flutter.',
        features: [
          'iOS & Android compatibility',
          'React Native, Expo, Flutter',
          'Native performance',
          'App store deployment',
          'Push notifications'
        ],
        popular: false,
        priceRange: 'Starting at $6,000'
      },
      {
        title: 'Website Redesign & Modernization',
        description: 'Auditing and rebuilding outdated websites to improve design, user experience, mobile responsiveness, and loading speed.',
        features: [
          'Complete website audit',
          'Modern design implementation',
          'Mobile responsiveness',
          'Performance optimization',
          'Improved user experience'
        ],
        popular: false,
        priceRange: 'Starting at $2,000'
      },
      {
        title: 'CMS Integration & Development',
        description: 'Implementing and customizing headless Content Management Systems (like Directus) or traditional systems to give clients easy control over their website content.',
        features: [
          'Headless CMS implementation',
          'Directus customization',
          'Easy content management',
          'API integration',
          'Training & documentation'
        ],
        popular: false,
        priceRange: 'Starting at $2,500'
      }
    ]
  },
  {
    category: 'Custom Software & Automation',
    services: [
      {
        title: 'Backend API Development',
        description: 'Engineering and optimizing high-volume, scalable backend APIs to process large amounts of data, integrating AI and machine learning features as needed.',
        features: [
          'High-volume, scalable APIs',
          'Large data processing',
          'AI/ML integration capabilities',
          'RESTful & GraphQL',
          'Comprehensive documentation'
        ],
        popular: true,
        priceRange: 'Starting at $3,000'
      },
      {
        title: 'Business Process Automation',
        description: 'Developing custom tools and scripts in Python and C# to automate repetitive manual tasks, increasing efficiency and reducing errors.',
        features: [
          'Python & C# automation',
          'Custom tool development',
          'Workflow optimization',
          'Error reduction',
          'Integration with existing systems'
        ],
        popular: false,
        priceRange: 'Starting at $1,500'
      },
      {
        title: 'AI & Machine Learning Integration',
        description: 'Integrating AI/ML classification algorithms into existing business systems to provide data-driven insights and functionality.',
        features: [
          'AI/ML algorithm integration',
          'Classification systems',
          'Data-driven insights',
          'Custom model training',
          'Business system integration'
        ],
        popular: false,
        priceRange: 'Starting at $4,000'
      },
      {
        title: 'Database Design & Optimization',
        description: 'Designing, implementing, and managing efficient database solutions using SQL (PostgreSQL) and NoSQL (Firestore, MongoDB) technologies.',
        features: [
          'SQL (PostgreSQL) expertise',
          'NoSQL (Firestore, MongoDB)',
          'Efficient schema design',
          'Query optimization',
          'Data migration services'
        ],
        popular: false,
        priceRange: 'Starting at $1,800'
      }
    ]
  },
  {
    category: 'Cloud & DevOps',
    services: [
      {
        title: 'Cloud Deployment & Management',
        description: 'Deploying, configuring, and managing web applications and services on cloud platforms like Amazon Web Services (AWS EC2, AWS Lambda) and Google Cloud Platform (GCP).',
        features: [
          'AWS (EC2, Lambda) deployment',
          'Google Cloud Platform (GCP)',
          'Infrastructure configuration',
          'Scalability optimization',
          'Cost optimization strategies'
        ],
        popular: false,
        priceRange: 'Starting at $2,000'
      },
      {
        title: 'CI/CD Pipeline Implementation',
        description: 'Setting up automated build, test, and deployment pipelines using tools like GitHub Actions and Jenkins to streamline development workflows and ensure reliable software delivery.',
        features: [
          'GitHub Actions setup',
          'Jenkins pipeline configuration',
          'Automated testing',
          'Continuous deployment',
          'Workflow optimization'
        ],
        popular: false,
        priceRange: 'Starting at $1,500'
      },
      {
        title: 'System Monitoring & Maintenance',
        description: 'Implementing monitoring solutions with tools like Sentry to proactively identify and resolve system issues, offering ongoing maintenance retainers for system reliability.',
        features: [
          'Sentry integration',
          'Proactive monitoring',
          'Issue identification & resolution',
          'Performance tracking',
          'Maintenance retainers available'
        ],
        popular: false,
        priceRange: 'From $500/month'
      }
    ]
  }
]


