"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
} from "lucide-react";

import CompanyLogo from "@/components/jobs/company-logo";
import SaveJobButton from "@/components/jobs/save-job-button";
import Reveal from "@/components/ui/reveal";
import type { LiveJob } from "@/lib/jobs/jsearch";

type Props = {
  jobs: LiveJob[];
  savedView?: boolean;
  onSavedChange?: (jobId: string, saved: boolean) => void;
};

export default function  LiveJobBrowser({
  jobs,
  savedView = false,
  onSavedChange,
  }: Props) {


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

    document.getElementById("job-results")?.focus({
      preventScroll: true,
    });
  }

  const paginationButton =
    "jp-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div>
      <Reveal>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          {savedView ? "Search your saved jobs" : "Find your next opportunity"}

          <div className="relative mt-3">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />

            <input
              id="job-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Role, company or skill"
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-[#f6f6f4] py-3 pl-12 pr-4 text-base outline-none transition-colors focus:border-violet-600 focus:ring-2 focus:ring-violet-100 sm:text-sm"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-stone-600">
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

            {(query || remoteOnly) && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-violet-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Reveal>

      <p
        id="job-results-count"
        className="mt-6 text-sm text-stone-600"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {filteredJobs.length}{" "}
        {filteredJobs.length === 1 ? "opportunity" : "opportunities"} in these
        results
      </p>

      <div
        id="job-results"
        role="region"
        aria-label="Job results"
        aria-describedby="job-results-count"
        tabIndex={-1}
        className="mt-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
      >
        {visibleJobs.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"
            >
              <Search className="h-5 w-5" />
            </div>

           <h2 className="text-lg font-semibold">
  {savedView && jobs.length === 0
    ? "No saved jobs yet"
    : "No opportunities found"}
</h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
  {jobs.length
    ? "Try another keyword or remove the remote filter."
    : savedView
      ? "Save opportunities while browsing and return to them here."
      : "No listings were returned. Please check back later."}
</p>

            {jobs.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="jp-action mt-5 min-h-11 rounded-xl bg-[#d8f275] px-5 py-3 text-sm font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid items-start gap-5 md:grid-cols-2">
            {visibleJobs.map((job, index) => (
              <Reveal
                key={job.id}
                delay={Math.min(index, 3) * 0.045}
                className="h-full min-w-0"
              >
                <article className="jp-card flex  min-w-0 flex-col rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
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

                  <p className="mt-4 flex items-start gap-2 text-sm text-stone-600">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span className="break-words">{job.location}</span>
                  </p>

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
                    <details className="jp-description mt-4 text-sm">
                      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg font-medium text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">
                        Read job description
                        <ChevronDown
                          aria-hidden="true"
                          className="jp-chevron h-4 w-4 shrink-0"
                        />
                      </summary>

                      <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-stone-600">
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
                        aria-label={`View and apply for ${job.title} at ${job.company} (opens in a new tab)`}
                        className="jp-action inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#242332] px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                      >
                        View & apply
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                      </a>
                    ) : (
                      <p className="rounded-xl bg-stone-100 px-4 py-3 text-center text-sm text-stone-600">
                        Application link unavailable
                      </p>
                    )}

                    <SaveJobButton
                      job={job}
                      onSavedChange={onSavedChange}
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Job results pagination"
          className="mt-8 flex items-center justify-between gap-2"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
            className={paginationButton}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Previous
          </button>

          <p className="text-sm text-stone-600">
            {currentPage} / {totalPages}
          </p>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => changePage(currentPage + 1)}
            className={paginationButton}
          >
            Next
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
