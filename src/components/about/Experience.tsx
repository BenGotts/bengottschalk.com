import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateSpan } from "@/content/dates";
import { experience } from "@/content/experience";

export default function Experience() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-8" id="Experience">
      <h2 className="text-3xl font-bold text-center md:text-left mb-6">Experience</h2>
      
      <div className="space-y-4">
      {experience.map((job, index) => (
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
                <p className="text-md text-gray-600 mb-3">{formatDateSpan(job)}</p>
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
