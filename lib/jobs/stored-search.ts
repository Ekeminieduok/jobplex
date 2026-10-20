import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { searchJobs, type LiveJob } from "@/lib/jobs/jsearch";

function normalizeQuery(query: string): string {
  const normalized = query.trim().replace(/\s+/g, " ").toLowerCase();

  if (!normalized) {
    throw new Error("A search query is required");
  }

  return normalized;
}

function isLiveJob(value: unknown): value is LiveJob {
  if (typeof value !== "object" || value === null) return false;

  const job = value as Record<string, unknown>;

  return (
    typeof job.id === "string" &&
    typeof job.title === "string" &&
    typeof job.company === "string" &&
    typeof job.location === "string" &&
    typeof job.description === "string" &&
    typeof job.employment === "string" &&
    typeof job.remote === "boolean" &&
    typeof job.source === "string"
  );
}

export async function refreshStoredSearch(
  query: string,
): Promise<LiveJob[]> {
  const normalized = normalizeQuery(query);
  const jobs = await searchJobs(normalized, {
  requireComplete: true,
});
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("save_job_search", {
    p_query: normalized,
    p_jobs: jobs,
  });

  if (error) {
    throw new Error(`Unable to save job search (${error.code})`);
  }

  return jobs;
}

export async function getStoredSearch(
  query: string,
): Promise<LiveJob[]> {
  const normalized = normalizeQuery(query);
  const supabase = createAdminClient();

  const { data: search, error: searchError } = await supabase
    .from("job_searches")
    .select("job_ids")
    .eq("query", normalized)
    .maybeSingle();

  if (searchError) {
    throw new Error(`Unable to load job search (${searchError.code})`);
  }

  // First use of this query: fetch and persist it.
  if (!search) {
    return refreshStoredSearch(normalized);
  }

  const ids = search.job_ids as string[];

  // A successfully imported empty search is a valid result.
  if (ids.length === 0) return [];

  const { data: rows, error: jobsError } = await supabase
    .from("job_listings")
    .select("external_id, payload")
    .eq("provider", "jsearch")
    .in("external_id", ids);

  if (jobsError) {
    throw new Error(`Unable to load stored jobs (${jobsError.code})`);
  }

  const byId = new Map<string, LiveJob>();

  for (const row of rows ?? []) {
    if (!isLiveJob(row.payload)) {
      throw new Error("Stored job has an unexpected format");
    }

    byId.set(row.external_id, row.payload);
  }

  // Preserve the original search ordering.
  return ids.flatMap((id) => {
    const job = byId.get(id);
    return job ? [job] : [];
  });
}