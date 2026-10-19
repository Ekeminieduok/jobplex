export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  arrangement: "remote" | "hybrid" | "onsite";
  employment: "full_time" | "part_time" | "contract" | "internship";
  experience: "graduate" | "junior" | "mid" | "senior";
  summary: string;
  skills: string[];
  logoUrl?: string;
description?: string[];
requirements?: string[];
};

export const sampleJobs: Job[] = [
  {
    id: "demo-frontend",
    title: "Frontend Developer",
    company: "Demo Fintech",
    location: "Lagos, Nigeria",
    arrangement: "hybrid",
    employment: "full_time",
    experience: "mid",
    summary:
      "Build responsive payment dashboards and customer-facing interfaces with React and TypeScript.",
    skills: ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
  },
  {
    id: "demo-support",
    title: "Customer Support Specialist",
    company: "Demo Customer Platform",
    location: "Nigeria",
    arrangement: "remote",
    employment: "full_time",
    experience: "junior",
    summary:
      "Resolve customer questions through email and chat, document issues, and collaborate with technical teams.",
    skills: ["Customer service", "Zendesk", "Communication"],
  },
  {
    id: "demo-nextjs",
    title: "Next.js Developer",
    company: "Demo Commerce",
    location: "Nigeria",
    arrangement: "remote",
    employment: "contract",
    experience: "mid",
    summary:
      "Develop an accessible storefront with reusable components, API integrations, and strong performance.",
    skills: ["Next.js", "React", "TypeScript", "Accessibility"],
  },
  {
    id: "demo-intern",
    title: "Software Engineering Intern",
    company: "Demo Technology Studio",
    location: "Abuja, Nigeria",
    arrangement: "onsite",
    employment: "internship",
    experience: "graduate",
    summary:
      "Work with experienced engineers to build features, investigate bugs, and strengthen your development skills.",
    skills: ["JavaScript", "HTML", "CSS", "Git"],
  },
  {
    id: "demo-product",
    title: "Product Designer",
    company: "Demo Design Studio",
    location: "Lagos, Nigeria",
    arrangement: "hybrid",
    employment: "full_time",
    experience: "mid",
    summary:
      "Design clear user journeys and thoughtful interfaces for financial and business products.",
    skills: ["Figma", "Prototyping", "User research"],
  },
  {
    id: "demo-web-support",
    title: "Website Support Assistant",
    company: "Demo Property Services",
    location: "Nigeria",
    arrangement: "remote",
    employment: "part_time",
    experience: "junior",
    summary:
      "Maintain website content, troubleshoot forms, and help customers complete booking workflows.",
    skills: ["Webflow", "HTML", "CSS", "Customer service"],
  },
  {
    id: "demo-senior",
    title: "Senior Frontend Engineer",
    company: "Demo Infrastructure",
    location: "Lagos, Nigeria",
    arrangement: "hybrid",
    employment: "full_time",
    experience: "senior",
    summary:
      "Lead frontend architecture, mentor developers, and improve reliability across a growing application.",
    skills: ["React", "TypeScript", "Testing", "Architecture"],
  },
];