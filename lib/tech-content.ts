export type TechLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type WorkExperience = {
  company: string;
  title: string;
  dates: string;
  highlights: string[];
};

export type PersonalBuild = {
  title: string;
  description: string;
  tags: string[];
  links?: TechLink[];
};

export const TECH_PROFILE = {
  headline: "Software Engineer",
  summary:
    "I'm currently employed full-time as a software engineer. This page is professional background and personal builds—not a job search. If something interesting comes up on the side, especially in cubing or community tooling, I'm open to hearing about it.",
  links: [
    { label: "Resume", href: "https://resume.bengottschalk.com", external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/benjgottschalk", external: true },
    { label: "GitHub", href: "https://github.com/BenGotts", external: true },
  ] as TechLink[],
};

export const TECH_EDUCATION = {
  school: "Oregon State University",
  degree: "B.S. Computer Science",
  minor: "Mathematics",
  dates: "2018 – 2021",
  detail: "Applied computer science with a focus in cybersecurity.",
};

export const TECH_EXPERIENCE: WorkExperience[] = [
  {
    company: "Marchex (MPS)",
    title: "Software Development Engineer",
    dates: "Oct 2022 – Sep 2023",
    highlights: [
      "Built Node.js backend for a high-volume API processing thousands of hours of call data.",
      "Developed Python scripts for Sentry monitoring and system reliability.",
      "Managed Node.js deployment with PM2; used AWS EC2 and Lambda for API development.",
      "Wrote complex SQL for data manipulation and enhanced features in an existing EJS codebase.",
    ],
  },
  {
    company: "Intel",
    title: "Software Development Engineer in Test",
    dates: "Mar 2022 – Oct 2022",
    highlights: [
      "Automated manual test cases in C# and Gherkin from Jira for validation teams.",
      "Helped migrate automation from TeamCity to Jenkins.",
      "Supported lab validation, troubleshooting, and manual test design.",
    ],
  },
  {
    company: "Pour Soul Systems",
    title: "Software Developer",
    dates: "Sep 2020 – Jun 2021",
    highlights: [
      "Co-developed a Flutter mobile app for a startup using BLoC state management.",
      "Worked in Agile Scrum with DynamoDB on the backend.",
    ],
  },
];

export const TECH_SKILL_GROUPS = [
  {
    label: "Languages",
    skills: ["TypeScript", "JavaScript", "Python", "C#", "SQL", "C++"],
  },
  {
    label: "Web & mobile",
    skills: ["Next.js", "React", "Node.js", "Flutter", "Tailwind CSS"],
  },
  {
    label: "Infrastructure",
    skills: ["AWS", "Firebase", "CI/CD", "GitHub Actions", "Docker"],
  },
  {
    label: "Other",
    skills: ["Cybersecurity", "Automation", "WCA API"],
  },
] as const;

export const PERSONAL_BUILDS: PersonalBuild[] = [
  {
    title: "bengottschalk.com",
    description:
      "Personal hub with live WCA data, a Solve of the Day archive, and competition history mapping across the PNW.",
    tags: ["Next.js", "React", "WCA API", "Leaflet"],
    links: [{ label: "Home", href: "/" }],
  },
  {
    title: "Pacific Northwest Cubing",
    description:
      "Regional platform for PNW competitions, delegates, and community resources.",
    tags: ["Next.js", "TypeScript", "Community"],
    links: [
      { label: "pnwcubing.com", href: "https://www.pnwcubing.com", external: true },
    ],
  },
  {
    title: "Solve of the Day",
    description:
      "Daily 3x3, Square-1, and 3BLD solves with scrambles, reconstructions, and video links.",
    tags: ["Content", "Archive"],
    links: [{ label: "Browse", href: "/content" }],
  },
];
