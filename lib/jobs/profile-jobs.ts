import "server-only";

import "server-only";

import {
  applicationKey,
  type LiveJob,
} from "@/lib/jobs/jsearch";

import { getStoredSearch } from "@/lib/jobs/stored-search";

type JobProfile = {
  target_role: string | null;
  location: string | null;
  skills: string[] | null;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsSkill(text: string, skill: string): boolean {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(
    `(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`,
    "i",
  ).test(text);
}

export async function getProfileJobs(
  profile: JobProfile,
): Promise<LiveJob[]> {
  const role = profile.target_role?.trim() ?? "";
  const location = profile.location?.trim() || "Nigeria";

  const skills = [
    ...new Set(
      (profile.skills ?? [])
        .filter((skill) => typeof skill === "string")
        .map(normalize)
        .filter(Boolean),
    ),
  ];

  const focus = role || skills.slice(0, 2).join(" ");

  const buildQuery = (place: string) =>
    focus ? `${focus} jobs in ${place}` : `jobs in ${place}`;

  const isNationwide = ["nigeria", "ng"].includes(
    normalize(location),
  );

  const firstResults = await getStoredSearch(buildQuery(location));

  const combined: LiveJob[] = firstResults.map((job) => ({
    ...job,
    searchScope: isNationwide ? "nationwide" : "local",
  }));

  const seenIds = new Set(combined.map((job) => job.id));
  const seenApplications = new Set<string>();

  for (const job of combined) {
    const key = applicationKey(job.applyUrl);

    if (key) seenApplications.add(key);
  }

  // This fallback is intended for profiles based in Nigeria.
  // Avoid repeating the same nationwide query.
  if (combined.length < 15 && !isNationwide) {
    try {
      const nationwideResults = await getStoredSearch(
        buildQuery("Nigeria"),
      );

      for (const job of nationwideResults) {
        const key = applicationKey(job.applyUrl);

        if (
          seenIds.has(job.id) ||
          (key && seenApplications.has(key))
        ) {
          continue;
        }

        combined.push({
          ...job,
          searchScope: "nationwide",
        });

        seenIds.add(job.id);

        if (key) seenApplications.add(key);
      }
    } catch (error) {
      // Don't present a provider failure as an empty result.
      if (combined.length === 0) throw error;

      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Job Plex] Broader search failed; keeping local results:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
  }

  return combined
    .map((job, index) => {
      const text = normalize(`${job.title} ${job.description}`);

      return {
        job,
        index,
        skillCount: skills.filter((skill) =>
          containsSkill(text, skill),
        ).length,
      };
    })
    .sort((a, b) => {
      const aScope = a.job.searchScope === "local" ? 0 : 1;
      const bScope = b.job.searchScope === "local" ? 0 : 1;

      return (
        aScope - bScope ||
        b.skillCount - a.skillCount ||
        a.index - b.index
      );
    })
    .map(({ job }) => job);
}