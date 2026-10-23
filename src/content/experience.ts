import type { DateSpan } from "./dates";

export interface Experience extends DateSpan {
  title: string;
  company: string;
  details: string[];
}

export const experience: Experience[] = [
  {
    title: "Software Developer",
    company: "Shadybrook Lumber Products",
    start: "2026-07",
    end: null,
    details: [],
  },
  {
    title: "Freelance Software Developer",
    company: "Self-employed",
    start: "2023-09",
    end: "2026-07",
    details: [],
  },
  {
    title: "Software Development Engineer",
    company: "Marchex (MPS)",
    start: "2022-10",
    end: "2023-09",
    details: [
      "Engineered Node.js backend for a high-volume API processing thousands of hours of call data.",
      "Developed Python scripts for Sentry monitoring, enhancing system reliability.",
      "Managed Node.js deployment using PM2, utilized AWS EC2 and Lambda for API development.",
      "Crafted and executed complex SQL queries for data manipulation and analysis.",
      "Enhanced features in existing EJS codebase, improving functionality.",
      "Aided in the growth and development of the MPS team, similar to a startup environment.",
    ],
  },
  {
    title: "Software Development Engineer in Test",
    company: "Intel",
    start: "2022-03",
    end: "2022-10",
    details: [
      "Developed automation tools in C# and Python supporting both automation and validation teams.",
      "Utilized C# and Gherkin to automate existing manual test cases from Jira, enhancing testing efficiency.",
      "Designed test cases for manual validation, later automated for consistency and efficiency.",
      "Assisted in migrating automation processes from Team City to Jenkins, improving development workflow.",
      "Performed lab technician duties including system troubleshooting, manual validation, and general tech support.",
    ],
  },
  {
    title: "Software Developer",
    company: "Pour Soul Systems",
    start: "2020-09",
    end: "2021-06",
    details: [
      "Co-developed a Flutter mobile app for a startup, focusing on aiding bars in reducing waste and saving costs.",
      "Implemented BLoC pattern for effective state management.",
      "Practiced Agile Scrum framework, ensuring disciplined project management.",
      "Demonstrated strong communication skills and accountability in team collaborations and external partnerships.",
      "Utilized DynamoDB as the database backend, facilitating scalable and efficient data storage solutions.",
    ],
  },
];
