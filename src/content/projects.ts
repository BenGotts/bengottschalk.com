import { compareNewestFirst, type DateSpan } from "./dates";

export interface Project extends DateSpan {
  title: string;
  technologies: string;
  details: string[];
  githubLink: string;
  projectLink?: string;
}

const projectList: Project[] = [
  {
    title: "bengottschalk.com",
    start: "2023-12",
    end: null,
    technologies: "Next.js, React, TypeScript, Tailwind CSS, DaisyUI, Zod, Vercel",
    details: [
      "Rebuilt my personal website as a home for my cubing, with Next.js 16, React 19, and TypeScript, deployed on Vercel.",
      "Pulls my competitions, personal records, and results from the World Cube Association API, validated with Zod and cached with Next.js Cache Components.",
      "Shows my latest YouTube uploads through the YouTube Data API.",
      "Styled with Tailwind CSS and DaisyUI in a dark theme inspired by Rubik's Cube colors.",
    ],
    githubLink: "https://github.com/BenGotts/bengottschalk.com",
    projectLink: "https://bengottschalk.com",
  },
  {
    title: "Personal Website",
    start: "2019-11",
    end: "2023-12",
    technologies: "HTML, CSS, Javascript, Node.js, Firebase, handlebars",
    details: [
      "Engineered a dynamic website on Google Firebase with a custom domain for a professional online presence.",
      "Deployed Firebase functions using Node.js and Handlebars for dynamic content management.",
      "Integrated various APIs for dynamic data loading and employed CSS for website design.",
    ],
    githubLink: "https://github.com/BenGotts/website",
  },
  // Hidden while cuble.app is offline; uncomment when it's back up.
  // {
  //   title: "Cuble Game",
  //   start: "2022-03",
  //   end: "2022-03",
  //   technologies: "React.js, Firebase, Firestore, Material UI (MUI), Netlify, GitHub Actions",
  //   details: [
  //     "Developed a Rubik's Cube-themed game using React/MUI with daily-scripted WCA data updates in Firestore.",
  //     "Hosted on Netlify with GitHub Actions CI/CD ensuring efficient deployment and maintenance.",
  //   ],
  //   githubLink: "https://github.com/BenGotts/cuble-app",
  //   projectLink: "https://cuble.app",
  // },
  {
    title: "Rubik's Cube Scrambling Program",
    start: "2018-12",
    end: "2020-08",
    technologies: "Python, OpenCV",
    details: [
      "Created a program for generating random Rubik's Cube scrambles with a visual representation using OpenCV.",
      "Utilized innovative Python techniques for an engaging and functional application.",
    ],
    githubLink: "https://github.com/BenGotts/Python-Rubiks-Cube-Scrambler",
  },
  {
    title: "smallsh",
    start: "2020-07",
    end: "2020-07",
    technologies: "C, Shell, Operating Systems",
    details: [
      "Used C to write a simple shell program.",
      "smallsh supports exit, cd, status, and # (for comments).",
      "Ignores ctrl+C and has background/foreground with ctrl+Z (using signals).",
    ],
    githubLink: "https://github.com/BenGotts/smallsh",
  },
  {
    title: "Cube Data",
    start: "2023-04",
    end: "2023-04",
    technologies: "React.js, Firebase, Firestore, Material UI (MUI), Netlify, GitHub Actions",
    details: [
      "Utilized React and MUI to create a visual interface for a local unofficial Rubik's Cube competiiton.",
      "Fetch uploaded data from Firestore.",
      "Hosted on Netlify with GitHub Actions to build and redeploy on main branch commits.",
    ],
    githubLink: "https://github.com/BenGotts/LocalCubeData",
    projectLink: "https://cubedata.netlify.app/",
  },
  {
    title: "Blackjack",
    start: "2019-01",
    end: "2019-01",
    technologies: "C++",
    details: [
      "Implemented Blackjack (21) command line game in C++.",
      "Allowed more than 1 user to play at a time.",
    ],
    githubLink: "https://github.com/BenGotts/blackjack_cpp",
  },
  {
    title: "PBL Trainer",
    start: "2020-03",
    end: "2020-03",
    technologies: "Python, Replit",
    details: [
      "Implemented command line tool for Square-1 solvers to train the last solving step.",
      "Uploaded to Replit and previously showcased on my personal website.",
    ],
    githubLink: "https://github.com/BenGotts/pblTrainer",
  },
];

/** Projects, newest first. */
export const projects: Project[] = projectList.toSorted(compareNewestFirst);
