export type Department =
  | "Engineering"
  | "QA"
  | "Analytics"
  | "Operations"
  | "Support"
  | "Marketing"
  | "Design";

export type Job = {
  id: string;
  title: string;
  dept: Department;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  salaryMin: number;
  salaryMax: number;
  summary: string;
  tags: string[];
  status: "upcoming" | "open";
  // расширения для детальной страницы
  about?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  tools?: string[];
  benefits?: string[];
};

export const JOBS: Job[] = [
  {
    id: "fe-01",
    title: "Frontend Engineer",
    dept: "Engineering",
    location: "Remote / Buenos Aires",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Next.js + TypeScript, polished UI, performance, animations.",
    tags: ["Next.js", "TypeScript", "Motion", "Design systems"],
    status: "upcoming",
  },
  {
    id: "be-01",
    title: "Backend Engineer",
    dept: "Engineering",
    location: "Remote / Buenos Aires",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "API design, payments, bookings, scalability, data flows.",
    tags: ["Node", "Postgres", "REST/GraphQL", "Payments"],
    status: "upcoming",
  },
  {
    id: "qa-01",
    title: "QA Engineer",
    dept: "QA",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "E2E + regression, test cases, release quality.",
    tags: ["Playwright", "TestRail", "E2E", "Bug triage"],
    status: "upcoming",
  },
  {
    id: "an-01",
    title: "Product/Data Analyst",
    dept: "Analytics",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Metrics, funnels, dashboards, product insights.",
    tags: ["SQL", "Amplitude/GA4", "Dashboards"],
    status: "upcoming",
  },
  {
    id: "ops-01",
    title: "COO / Operations Director",
    dept: "Operations",
    location: "Buenos Aires / Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Operations, processes, partners, SLAs, scaling.",
    tags: ["Ops", "Playbooks", "SLA", "Partners"],
    status: "upcoming",
  },
  {
    id: "sup-01",
    title: "Support Specialist",
    dept: "Support",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "First-line support, case triage, customer care.",
    tags: ["Helpdesk", "Comms", "Triage"],
    status: "upcoming",
  },
  {
    id: "smm-01",
    title: "Social Media Marketer (SMM)",
    dept: "Marketing",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Content, social channels, community growth.",
    tags: ["Content", "Social", "Growth"],
    status: "upcoming",
  },
  {
    id: "des-01",
    title: "Product Designer",
    dept: "Design",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Design systems, visuals, prototypes, research.",
    tags: ["Design system", "Figma", "Prototyping"],
    status: "upcoming",
  },
];

export const JOB_MAP: Record<string, Job> = Object.fromEntries(
  JOBS.map((j) => [j.id, j])
) as Record<string, Job>;
