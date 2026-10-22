export const SKILL_ALIASES: Record<string, string[]> = {
  JavaScript: ["javascript"],
  TypeScript: ["typescript"],
  React: ["react", "react.js", "reactjs"],
  "Next.js": ["next.js", "nextjs"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3"],
  "Tailwind CSS": ["tailwind", "tailwind css"],
  "Node.js": ["node.js", "nodejs"],
  Python: ["python"],
  SQL: ["sql", "postgresql", "mysql"],
  Git: ["git", "github"],
  Figma: ["figma"],
  "UI design": ["ui design", "user interface design"],
  "UX research": ["ux research", "user research"],
  Excel: ["excel", "microsoft excel"],
  "Power BI": ["power bi", "powerbi"],
  "Data analysis": ["data analysis", "data analytics"],
  "Customer support": ["customer support", "customer service"],
  Zendesk: ["zendesk"],
  "Technical support": ["technical support", "it support"],
  Troubleshooting: ["troubleshooting"],
  Salesforce: ["salesforce"],
  CRM: ["crm", "customer relationship management"],
  Sales: ["sales"],
  "Lead generation": ["lead generation", "prospecting"],
  SEO: ["seo", "search engine optimization"],
  "Content marketing": ["content marketing"],
  "Social media": ["social media"],
  Accounting: ["accounting", "bookkeeping"],
  QuickBooks: ["quickbooks"],
  Recruitment: ["recruitment", "recruiting"],
  "Human resources": ["human resources"],
  "Project management": ["project management"],
  Agile: ["agile", "scrum"],
};

type RoleRule = {
  title: string;
  aliases: string[];
  skills: string[];
};

export const ROLE_RULES: RoleRule[] = [
  {
    title: "Frontend Developer",
    aliases: ["frontend developer", "front-end developer", "front end developer"],
    skills: ["JavaScript", "TypeScript", "React", "Next.js", "HTML", "CSS"],
  },
  {
    title: "Full Stack Developer",
    aliases: ["full stack developer", "full-stack developer"],
    skills: ["React", "Node.js", "SQL"],
  },
  {
    title: "UI UX Designer",
    aliases: ["ui ux designer", "ui/ux designer", "product designer"],
    skills: ["Figma", "UI design", "UX research"],
  },
  {
    title: "Data Analyst",
    aliases: ["data analyst"],
    skills: ["SQL", "Excel", "Power BI", "Data analysis", "Python"],
  },
  {
    title: "Customer Support Specialist",
    aliases: ["customer support specialist", "customer service representative"],
    skills: ["Customer support", "Zendesk", "CRM"],
  },
  {
    title: "IT Support Specialist",
    aliases: ["it support specialist", "technical support specialist"],
    skills: ["Technical support", "Troubleshooting"],
  },
  {
    title: "Sales Representative",
    aliases: ["sales representative", "sales executive"],
    skills: ["Sales", "Lead generation", "Salesforce", "CRM"],
  },
  {
    title: "Digital Marketing Specialist",
    aliases: ["digital marketing specialist", "digital marketer"],
    skills: ["SEO", "Content marketing", "Social media"],
  },
  {
    title: "Accountant",
    aliases: ["accountant", "bookkeeper"],
    skills: ["Accounting", "QuickBooks", "Excel"],
  },
  {
    title: "HR Officer",
    aliases: ["hr officer", "human resources officer"],
    skills: ["Recruitment", "Human resources"],
  },
  {
    title: "Project Coordinator",
    aliases: ["project coordinator", "project manager"],
    skills: ["Project management", "Agile"],
  },
];

export function containsTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(
    `(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`,
    "i",
  ).test(text);
}

export function suggestFromText(rawText: string) {
  const text = rawText
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const skills = Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) =>
      aliases.some((alias) => containsTerm(text, alias)),
    )
    .map(([skill]) => skill);

  const roles = ROLE_RULES.flatMap((rule) => {
    const mentioned = rule.aliases.some((alias) =>
      containsTerm(text, alias),
    );

    const matched = rule.skills.filter((skill) =>
      skills.includes(skill),
    );

    if (!mentioned && matched.length < 2) return [];

    return [{
      title: rule.title,
      reason: mentioned
        ? "This role title appears in your resume."
        : `Suggested from: ${matched.join(", ")}.`,
    }];
  });

  return { skills, roles };
}

// Tie saved preferences to a particular uploaded file.
// Replacing or deleting the PDF makes old preferences inactive.
export function resumeVersion(file: {
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}): string {
  const timestamp = file.updated_at ?? file.created_at;

  if (!timestamp) {
    throw new Error("Unable to identify this resume version.");
  }

  return `${file.id ?? "resume.pdf"}:${timestamp}`;
}