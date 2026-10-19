import "server-only";

export type LiveJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  logoUrl?: string;
  applyUrl?: string;
  description: string;
  employment: string;
  remote: boolean;
  source: string;
  postedAt?: string;
  searchScope?: "local" | "nationwide";
};

const TARGET_JOB_COUNT = 15;
const MAX_PAGES = 3;


function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeUrl(value: unknown): string | undefined {
  const text = asText(value);

  if (!text) return undefined;

  try {
    const url = new URL(text);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function postingDate(item: Record<string, unknown>): string | undefined {
  const dateText = asText(item.job_posted_at_datetime_utc);

  if (dateText) {
    const milliseconds = Date.parse(dateText);

    if (Number.isFinite(milliseconds)) {
      return new Date(milliseconds).toISOString();
    }
  }

  const timestamp = item.job_posted_at_timestamp;

  if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
    const date = new Date(timestamp * 1000);

    if (Number.isFinite(date.getTime())) {
      return date.toISOString();
    }
  }

  return undefined;
}

// Remove common tracking parameters while retaining parameters
// that may identify the vacancy itself.
export function applicationKey(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;

  const url = new URL(value);

  url.hash = "";

  for (const key of [...url.searchParams.keys()]) {
    if (
      key.toLowerCase().startsWith("utm_") ||
      ["gclid", "fbclid", "msclkid"].includes(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.sort();

  return url.href;
}

function normalizeJob(value: unknown): LiveJob | null {
  const item = asObject(value);
  const id = asText(item.job_id);
  const title = asText(item.job_title);

  if (!id || !title) return null;

  return {
    id,
    title,
    company: asText(item.employer_name) || "Company not specified",
    location:
      asText(item.job_location) ||
      [
        asText(item.job_city),
        asText(item.job_state),
        asText(item.job_country),
      ]
        .filter(Boolean)
        .join(", ") ||
      "Location not specified",
    logoUrl: safeUrl(item.employer_logo),
    applyUrl: safeUrl(item.job_apply_link),
    description: asText(item.job_description),
    employment:
      asText(item.job_employment_type) ||
      "Employment type not specified",
    remote: item.job_is_remote === true,
    source: asText(item.job_publisher) || "Original listing",
    postedAt: postingDate(item),
  };
}

async function fetchPage(
  query: string,
  apiKey: string,
  cursor?: string,
): Promise<{ items: unknown[]; nextCursor?: string }> {
  const url = new URL(
    "https://api.openwebninja.com/jsearch/search-v2",
  );

  url.searchParams.set("query", query);
  url.searchParams.set("country", "ng");

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(
      `Job provider request failed (${response.status})`,
    );
  }

  const payload = asObject(await response.json());
  const data = asObject(payload.data);

  const items: unknown = Array.isArray(payload.data)
    ? payload.data
    : data.jobs;

  if (
    (typeof payload.status === "string" && payload.status !== "OK") ||
    !Array.isArray(items)
  ) {
    throw new Error(
      `Unexpected job provider response: ${JSON.stringify({
        status: payload.status,
        topLevelKeys: Object.keys(payload),
        dataKeys: Object.keys(data),
      })}`,
    );
  }
  if (process.env.NODE_ENV === "development") {
  const dateSamples = items.map((value) => {
    const job = asObject(value);

    return {
      title: asText(job.job_title),
      parsedDate: postingDate(job) ?? null,
      dateFields: Object.fromEntries(
        Object.entries(job).filter(([key]) =>
          /date|posted|time|expir/i.test(key),
        ),
      ),
    };
  });

  console.info(
    "[JSearch] Posting dates:",
    JSON.stringify(dateSamples, null, 2),
  );
}

    if (process.env.NODE_ENV === "development") {
  console.info("[JSearch] Pagination:", {
    received: items.length,
    hasNextPage: Boolean(asText(data.cursor)),
  });
}

  return {
    items,
    nextCursor: asText(data.cursor) || undefined,
  };
}

export async function searchJobs(
  query = "jobs in Nigeria",
): Promise<LiveJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;

  if (!apiKey) {
    throw new Error("Missing JSEARCH_API_KEY");
  }

  const searchQuery = query.trim();

  if (!searchQuery) {
    throw new Error("A job search query is required");
  }

  const jobs = new Map<string, LiveJob>();
  const seenApplications = new Set<string>();
  const seenCursors = new Set<string>();

  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    try {
      const result = await fetchPage(searchQuery, apiKey, cursor);

      for (const item of result.items) {
        const job = normalizeJob(item);

        if (!job || jobs.has(job.id)) continue;

        const applyKey = applicationKey(job.applyUrl);

        if (applyKey && seenApplications.has(applyKey)) {
          continue;
        }

        jobs.set(job.id, job);

        if (applyKey) {
          seenApplications.add(applyKey);
        }
      }

      if (jobs.size >= TARGET_JOB_COUNT) break;

      const nextCursor = result.nextCursor;

      // Stop when there are no more pages or a cursor repeats.
      if (!nextCursor || seenCursors.has(nextCursor)) {
        break;
      }

      seenCursors.add(nextCursor);
      cursor = nextCursor;
    } catch (error) {
      // Surface failures when we have no usable listings.
      if (jobs.size === 0) {
        throw error;
      }

      // Preserve successful pages if a subsequent request fails.
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[JSearch] Additional page unavailable; keeping fetched jobs:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }

      break;
    }
  }

  // Recent dated listings first; undated listings follow.
  // The jobs page can then apply your existing skill ranking.
  return [...jobs.values()].sort((a, b) => {
    const firstDate = a.postedAt ? Date.parse(a.postedAt) : 0;
    const secondDate = b.postedAt ? Date.parse(b.postedAt) : 0;

    return secondDate - firstDate;
  });
}