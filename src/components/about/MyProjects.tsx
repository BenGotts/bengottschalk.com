import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { formatDateSpan } from "@/content/dates";
import { projects } from "@/content/projects";

export default function MyProjects() {
    return (
        <section className="max-w-4xl mx-auto px-4 py-8" id="Projects">
          <h2 className="text-3xl font-bold text-center md:text-left mb-6">Projects</h2>
          
          <div className="space-y-4">
            {projects.map((project, index) => (
            <Card key={index} className="w-full">
                    <CardContent className="p-4">
                        <div className="text-lg font-semibold mb-3">
                            <div className="flex h-5 items-center space-x-2">
                                <div>{project.projectLink ? 
                                    <Link
                                        href={project.projectLink}
                                        target="_blank"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        {project.title}
                                    </Link> : project.title}
                                </div>
                                <Separator orientation="vertical" className="h-5" />
                                <p className="font-normal text-sm text-gray-600">{formatDateSpan(project)}</p>
                            </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="mb-3">
                            <p className="text-md text-gray-600">Technologies: {project.technologies}</p>
                            <ul className="list-disc pl-5 text-gray-700 mt-2">
                            {project.details.map((detail, detailIndex) => (
                                <li key={detailIndex}>{detail}</li>
                            ))}
                            </ul>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div>
                            <Link
                                href={project.githubLink}
                                target="_blank"
                                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                            >
                                Visit source code on GitHub
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </Link>
                        </div>
                    </CardContent>
                </Card>))}
            </div>
        </section>
      );
}