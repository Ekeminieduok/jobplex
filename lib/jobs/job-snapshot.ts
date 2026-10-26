import type { LiveJob } from "@/lib/jobs/jsearch";

function text(value: unknown, max = 500): string {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 8000) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    return url.href;
  } catch {
    return undefined;
  }
}

export function jobSnapshot(value: unknown): LiveJob | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const item = value as Record<string, unknown>;
  const id = text(item.id, 2000);
  const title = text(item.title);

  if (!id || !title) return null;

  const date = text(item.postedAt, 100);
  const postedAt =
    date && Number.isFinite(Date.parse(date))
      ? new Date(date).toISOString()
      : undefined;

  return {
    id,
    title,
    company: text(item.company) || "Company not specified",
    location: text(item.location) || "Location not specified",
    description: text(item.description, 50_000),
    employment: text(item.employment) || "Employment type not specified",
    source: text(item.source) || "Original listing",
    remote: item.remote === true,
    logoUrl: safeUrl(item.logoUrl),
    applyUrl: safeUrl(item.applyUrl),
    postedAt,
    searchScope:
      item.searchScope === "local" || item.searchScope === "nationwide"
        ? item.searchScope
        : undefined,
  };
}