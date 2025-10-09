import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface JobExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  details: string[];
}

const experiences: JobExperience[] = [
  {
    title: "Software Development Engineer",
    company: "Marchex (MPS)",
    startDate: "Oct 2022",
    endDate: "Sep 2023",
    details: [
      "Engineered Node.js backend for a high-volume API processing thousands of hours of call data.",
      "Developed Python scripts for Sentry monitoring, enhancing system reliability.",
      "Managed Node.js deployment using PM2, utilized AWS EC2 and Lambda for API development.",
      "Crafted and executed complex SQL queries for data manipulation and analysis.",
      "Enhanced features in existing EJS codebase, improving functionality.",
      "Aided in the growth and development of the MPS team, similar to a startup environment."
    ]
  },
  {
    title: "Software Development Engineer in Test",
    company: "Intel",
    startDate: "Mar 2022",
    endDate: "Oct 2022",
    details: [
      "Developed automation tools in C# and Python supporting both automation and validation teams.",
      "Utilized C# and Gherkin to automate existing manual test cases from Jira, enhancing testing efficiency.",
      "Designed test cases for manual validation, later automated for consistency and efficiency.",
      "Assisted in migrating automation processes from Team City to Jenkins, improving development workflow.",
      "Performed lab technician duties including system troubleshooting, manual validation, and general tech support."
    ]
  },
  {
    title: "Software Developer",
    company: "Pour Soul Systems",
    startDate: "Sep 2020",
    endDate: "Jun 2021",
    details: [
      "Co-developed a Flutter mobile app for a startup, focusing on aiding bars in reducing waste and saving costs.",
      "Implemented BLoC pattern for effective state management.",
      "Practiced Agile Scrum framework, ensuring disciplined project management.",
      "Demonstrated strong communication skills and accountability in team collaborations and external partnerships.",
      "Utilized DynamoDB as the database backend, facilitating scalable and efficient data storage solutions."
    ]
  }
];

export default function Experience() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-8" id="Experience">
      <h2 className="text-3xl font-bold text-center md:text-left mb-6">Experience</h2>
      
      <div className="space-y-4">
      {experiences.map((job, index) => (
          <Card key={index} className="w-full">
            <CardContent className="p-4">
              <div className="text-lg font-semibold mb-3">
                <div className="flex h-5 items-center space-x-2">
                  <div>{job.title}</div>
                  <Separator orientation="vertical" className="h-5" />
                  <div>{job.company}</div>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div>
                <p className="text-md text-gray-600 mb-3">{job.startDate === job.endDate ? job.startDate : `${job.startDate} - ${job.endDate ? job.endDate : "Present"}`}</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {job.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>{detail}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}


