export type MusicEnsemble = {
  id: string;
  name: string;
  shortName: string;
  role: string;
  description: string;
  details: string[];
  links: Array<{ label: string; href: string }>;
};

export const MUSIC_ENSEMBLES: MusicEnsemble[] = [
  {
    id: "symphony",
    name: "Hillsboro Symphony Orchestra",
    shortName: "HSO",
    role: "Trumpet",
    description:
      "A community symphony orchestra based in Hillsboro, Oregon — sharing orchestral music with Washington County through concerts, education, and outreach.",
    details: [
      "Community orchestra founded in 2001, led by conductor Jeff Hornick",
      "Repertoire spans symphonies, concertos, film scores, and contemporary works",
      "Concerts at Hidden Creek Community Center and venues across the Portland metro",
    ],
    links: [
      { label: "hillsborosymphony.org", href: "https://hillsborosymphony.org" },
      { label: "Concert schedule", href: "https://hillsborosymphony.org/concerts" },
    ],
  },
  {
    id: "marching",
    name: "One More Time Around Again Marching Band",
    shortName: "OMTAAMB",
    role: "Trumpet",
    description:
      "Portland's legendary adult marching band — a Rose Festival fixture marching in the Starlight and Grand Floral parades each June.",
    details: [
      "One of the largest permanent marching bands in the world, with 400+ members",
      "Open to former high school, college, and military marching band musicians 18+",
      "Annual performances at the Portland Rose Festival and community concerts",
    ],
    links: [
      { label: "omtaamb.org", href: "https://www.omtaamb.org" },
      { label: "Performances", href: "https://www.omtaamb.org/performances" },
    ],
  },
];
