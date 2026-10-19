"use client";

import { useState } from "react";
import CompanyLogo from "@/components/jobs/company-logo";
import type { LiveJob } from "@/lib/jobs/jsearch";

type Props = {
  jobs: LiveJob[];
};

export default function LiveJobBrowser({ jobs }: Props) {
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const filteredJobs = jobs.filter((job) => {
    const searchable =
      `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase();

    return (
      terms.every((term) => searchable.includes(term)) &&
      (!remoteOnly || job.remote)
    );
  });

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function resetFilters() {
    setQuery("");
    setRemoteOnly(false);
    setPage(1);
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    document.getElementById("job-results")?.focus();
  }

  return (
    <div>
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <label
          htmlFor="job-search"
          className="text-sm font-semibold text-[#242332]"
        >
          Find your next opportunity
        </label>

        <input
          id="job-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search these results by role, company or skill"
          className="mt-3 w-full rounded-xl border border-stone-300 bg-[#f6f6f4] px-4 py-3 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
        />

        <label className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(event) => {
              setRemoteOnly(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-violet-700"
          />
          Remote listings only
        </label>
      </div>

      <p className="mt-6 text-sm text-stone-600" aria-live="polite">
        {filteredJobs.length}{" "}
        {filteredJobs.length === 1 ? "opportunity" : "opportunities"} in these
        results
      </p>

      <div id="job-results" tabIndex={-1} className="mt-4 outline-none">
        {visibleJobs.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold">No opportunities found</h2>

            <p className="mt-2 text-sm text-stone-600">
              {jobs.length
                ? "Try another keyword or remove the remote filter."
                : "No listings were returned. Please check back later."}
            </p>

            {jobs.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-[#d8f275] px-5 py-3 text-sm font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {visibleJobs.map((job) => (
              <article
                key={job.id}
                className="flex min-w-0 flex-col rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <CompanyLogo company={job.company} src={job.logoUrl} />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-sm text-stone-600">
                      {job.company}
                    </p>
                    <h2 className="mt-1 break-words text-lg font-semibold leading-snug">
                      {job.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-sm text-stone-600">{job.location}</p>
                <p className="mt-2 text-xs text-stone-500">
                  {job.postedAt
                    ? `Posted ${new Date(job.postedAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      )}`
                    : "Posting date not provided"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-stone-100 px-3 py-1.5">
                    {job.employment}
                  </span>

                  {job.remote && (
                    <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-800">
                      Remote
                    </span>
                  )}

                  {job.searchScope === "nationwide" && (
                    <span className="rounded-full bg-lime-100 px-3 py-1.5 text-lime-900">
                      Across Nigeria
                    </span>
                  )}
                </div>

                {job.description && (
                  <details className="mt-5 text-sm">
                    <summary className="cursor-pointer font-medium text-violet-700">
                      Read job description
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-stone-600">
                      {job.description}
                    </p>
                  </details>
                )}

                <div className="mt-auto pt-6">
                  <p className="mb-3 text-xs text-stone-500">
                    Source: {job.source}
                  </p>

                  {job.applyUrl ? (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-[#242332] px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
                      aria-label={`View and apply for ${job.title} at ${job.company} (opens in a new tab)`}
                    >
                      View & apply ↗
                    </a>
                  ) : (
                    <p className="rounded-xl bg-stone-100 px-4 py-3 text-center text-sm text-stone-600">
                      Application link unavailable
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Job results pagination"
          className="mt-8 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <p className="text-sm text-stone-600">
            {currentPage} / {totalPages}
          </p>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => changePage(currentPage + 1)}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
