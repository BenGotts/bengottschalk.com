import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface Project {
  title: string;
  startDate: string;
  endDate: string;
  technologies: string;
  details: string[];
  githubLink: string;
  projectLink?: string;
}

const projects: Project[] = [
    {
      title: "Next.js Personal Website",
      startDate: "Dec 2023",
      endDate: "",
      technologies: "Next.js, NextUI, React.js, Tailwind CSS, Node.js, Firebase",
      details: [
        "Revamped personal website with Next.js, NextUI, and Tailwind CSS for modern design; hosted on Firebase.",
        "Enhanced site with Next.js for server-side rendering and static generation, boosting performance and SEO.",
        "Employed Tailwind CSS and NextUI for efficient styling and cohesive UI."
      ],
      githubLink: "https://github.com/BenGotts/website-nextjs"
    },
    {
        title: "Personal Website",
        startDate: "Nov 2019",
        endDate: "Dec 2023",
        technologies: "HTML, CSS, Javascript, Node.js, Firebase, handlebars",
        details: [
          "Engineered a dynamic website on Google Firebase with a custom domain for a professional online presence.",
          "Deployed Firebase functions using Node.js and Handlebars for dynamic content management.",
          "Integrated various APIs for dynamic data loading and employed CSS for website design."
        ],
        githubLink: "https://github.com/BenGotts/website"
      },
    {
      title: "Cuble Game",
      startDate: "Mar 2022",
      endDate: "Mar 2022",
      technologies: "React.js, Firebase, Firestore, Material UI (MUI), Netlify, GitHub Actions",
      details: [
        "Developed a Rubik's Cube-themed game using React/MUI with daily-scripted WCA data updates in Firestore.",
        "Hosted on Netlify with GitHub Actions CI/CD ensuring efficient deployment and maintenance."
      ],
      githubLink: "https://github.com/BenGotts/cuble-app",
      projectLink: "https://cuble.app"
    },
    {
      title: "Rubik's Cube Scrambling Program",
      startDate: "Dec 2018",
      endDate: "Aug 2020",
      technologies: "Python, OpenCV",
      details: [
        "Created a program for generating random Rubik's Cube scrambles with a visual representation using OpenCV.",
        "Utilized innovative Python techniques for an engaging and functional application."
      ],
      githubLink: "https://github.com/BenGotts/website-nextjs"
    },
    {
        title: "smallsh",
        startDate: "Jul 2020",
        endDate: "Jul 2020",
        technologies: "C, Shell, Operating Systems",
        details: [
          "Used C to write a simple shell program.",
          "smallsh supports exit, cd, status, and # (for comments).",
          "Ignores ctrl+C and has background/foreground with ctrl+Z (using signals)."
        ],
        githubLink: "https://github.com/BenGotts/smallsh"
      },
      {
        title: "Cube Data",
        startDate: "Apr 2023",
        endDate: "Apr 2023",
        technologies: "React.js, Firebase, Firestore, Material UI (MUI), Netlify, GitHub Actions",
        details: [
          "Utilized React and MUI to create a visual interface for a local unofficial Rubik's Cube competiiton.",
          "Fetch uploaded data from Firestore.",
          "Hosted on Netlify with GitHub Actions to build and redeploy on main branch commits."
        ],
        githubLink: "https://github.com/BenGotts/LocalCubeData",
        projectLink: "https://cubedata.netlify.app/"
      },
      {
        title: "Blackjack",
        startDate: "Jan 2019",
        endDate: "Jan 2019",
        technologies: "C++",
        details: [
          "Implemented Blackjack (21) command line game in C++.",
          "Allowed more than 1 user to play at a time."
        ],
        githubLink: "https://github.com/BenGotts/blackjack_cpp"
      },
      {
        title: "PBL Trainer",
        startDate: "Mar 2020",
        endDate: "Mar 2020",
        technologies: "Python, Replit",
        details: [
          "Implemented command line tool for Square-1 solvers to train the last solving step.",
          "Uploaded to Replit and previously showcased on my personal website."
        ],
        githubLink: "https://github.com/BenGotts/pblTrainer"
      },
  ];
  
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(); // Treat projects without an end date as ongoing, i.e., very recent
    const [monthStr, year] = dateStr.split(' ');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthStr);
    return new Date(parseInt(year), month);
  };
  
  // Sort projects by startDate and endDate, newest first
projects.sort((a, b) => {
    const startDiff = parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime();
    if (startDiff !== 0) return startDiff;
    // If startDate is the same, sort by endDate, considering ongoing projects as the newest
    return parseDate(b.endDate || "Dec 9999").getTime() - parseDate(a.endDate || "Dec 9999").getTime(); // Treat no endDate as far future
  });
  

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
                                <p className="font-normal text-sm text-gray-600">{project.startDate === project.endDate ? project.startDate : `${project.startDate} - ${project.endDate ? project.endDate : "Present"}`}</p>
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


