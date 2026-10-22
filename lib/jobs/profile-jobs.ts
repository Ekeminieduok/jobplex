import "server-only";

import {
  applicationKey,
  type LiveJob,
} from "@/lib/jobs/jsearch";
import { getStoredSearch } from "@/lib/jobs/stored-search";
import { createClient } from "@/lib/supabase/server";
import {
  containsTerm,
  resumeVersion,
  ROLE_RULES,
  SKILL_ALIASES,
} from "@/lib/resume/suggestions";

type JobProfile = {
  target_role: string | null;
  location: string | null;
  skills: string[] | null;
};

type ResumePreferences = {
  skills: string[];
  role: string;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

async function getResumePreferences(): Promise<ResumePreferences> {
  const empty = { skills: [], role: "" };

  try {
    const supabase = await createClient();

    const { data: auth, error: authError } =
      await supabase.auth.getUser();

    if (authError || !auth.user) return empty;

    const userId = auth.user.id;

    const { data: preferences, error } = await supabase
      .from("resume_search_preferences")
      .select("source_version, approved_skills, approved_role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!preferences) return empty;

    const { data: files, error: storageError } = await supabase.storage
      .from("resumes")
      .list(userId, { search: "resume.pdf", limit: 10 });

    if (storageError) throw storageError;

    const file = files.find((item) => item.name === "resume.pdf");

    if (!file || resumeVersion(file) !== preferences.source_version) {
      return empty;
    }

    // Treat database values as untrusted input.
    const skills = Array.isArray(preferences.approved_skills)
      ? preferences.approved_skills
          .filter(
            (value: unknown): value is string =>
              typeof value === "string" &&
              Object.hasOwn(SKILL_ALIASES, value),
          )
          .slice(0, 20)
      : [];

    const role = ROLE_RULES.some(
      (rule) => rule.title === preferences.approved_role,
    )
      ? String(preferences.approved_role)
      : "";

    return { skills, role };
  } catch {
    // Optional resume preferences must not break the main job feed.
    console.warn(
      "[Job Plex] Resume search preferences unavailable; using profile.",
    );

    return empty;
  }
}

export async function getProfileJobs(
  profile: JobProfile,
): Promise<LiveJob[]> {
  const role = profile.target_role?.trim() ?? "";
  const location = profile.location?.trim() || "Nigeria";

  const profileSkills = [
    ...new Set(
      (profile.skills ?? [])
        .filter((skill) => typeof skill === "string")
        .map(normalize)
        .filter(Boolean),
    ),
  ];

  // Resume preferences must not replace the primary search focus.
  const focus = role || profileSkills.slice(0, 2).join(" ");

  const buildQuery = (searchFocus: string, place: string) =>
    searchFocus
      ? `${searchFocus} jobs in ${place}`
      : `jobs in ${place}`;

  const isNationwide = ["nigeria", "ng"].includes(
    normalize(location),
  );

  const [firstResults, preferences] = await Promise.all([
    getStoredSearch(buildQuery(focus, location)),
    getResumePreferences(),
  ]);

  const skills = [
    ...new Set([
      ...profileSkills,
      ...preferences.skills.map(normalize),
    ]),
  ];

  const combined: {
    job: LiveJob;
    additional: boolean;
    index: number;
  }[] = [];

  const seenIds = new Set<string>();
  const seenApplications = new Set<string>();

  function addJobs(
    jobs: LiveJob[],
    scope: "local" | "nationwide",
    additional: boolean,
  ) {
    for (const job of jobs) {
      const key = applicationKey(job.applyUrl);

      if (
        seenIds.has(job.id) ||
        (key && seenApplications.has(key))
      ) {
        continue;
      }

      combined.push({
        job: { ...job, searchScope: scope },
        additional,
        index: combined.length,
      });

      seenIds.add(job.id);
      if (key) seenApplications.add(key);
    }
  }

  addJobs(
    firstResults,
    isNationwide ? "nationwide" : "local",
    false,
  );

  // Preserve your existing Nigeria-wide fallback.
  if (combined.length < 15 && !isNationwide) {
    try {
      const nationwide = await getStoredSearch(
        buildQuery(focus, "Nigeria"),
      );

      addJobs(nationwide, "nationwide", false);
    } catch (error) {
      if (combined.length === 0) throw error;

      console.warn(
        "[Job Plex] Nationwide search unavailable; keeping local results.",
      );
    }
  }

  const selectedRule = ROLE_RULES.find(
    (rule) => rule.title === preferences.role,
  );

  const sameRole =
    normalize(preferences.role) === normalize(role) ||
    Boolean(
      selectedRule?.aliases.some(
        (alias) => normalize(alias) === normalize(role),
      ),
    );

  if (preferences.role && !sameRole) {
    try {
      const additionalJobs = await getStoredSearch(
        buildQuery(preferences.role, location),
      );

      addJobs(
        additionalJobs,
        isNationwide ? "nationwide" : "local",
        true,
      );
    } catch {
      console.warn(
        "[Job Plex] Resume-assisted search unavailable; keeping profile results.",
      );
    }
  }

  return combined
    .map((entry) => {
      const text = normalize(
        `${entry.job.title} ${entry.job.description}`,
      );

      return {
        ...entry,
        skillCount: skills.filter((skill) =>
          containsTerm(text, skill),
        ).length,
      };
    })
    .sort((a, b) => {
      // Primary profile results always come before additional-role results.
      const sourceOrder = Number(a.additional) - Number(b.additional);

      const aScope = a.job.searchScope === "local" ? 0 : 1;
      const bScope = b.job.searchScope === "local" ? 0 : 1;

      return (
        sourceOrder ||
        aScope - bScope ||
        b.skillCount - a.skillCount ||
        a.index - b.index
      );
    })
    .map(({ job }) => job);
}