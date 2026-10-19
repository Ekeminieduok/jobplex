"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/jobs/sample-jobs";
import CompanyLogo from "@/components/jobs/company-logo";

const PAGE_SIZE = 6;

const labels: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  graduate: "Graduate",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
};

const controlStyles =
  "min-h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

const emptyFilters = {
  query: "",
  location: "",
  arrangement: "",
  employment: "",
  experience: "",
};

type Filters = typeof emptyFilters;

export default function JobBrowser({ jobs }: { jobs: Job[] }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  function updateFilter(field: keyof Filters, value: string) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ ...emptyFilters });
    setPage(1);
  }

  const keywords = filters.query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const filteredJobs = jobs.filter((job) => {
    const searchableText = [
      job.title,
      job.company,
      job.summary,
      ...job.skills,
    ]
      .join(" ")
      .toLowerCase();

    return (
      keywords.every((keyword) =>
        searchableText.includes(keyword),
      ) &&
      job.location
        .toLowerCase()
        .includes(filters.location.trim().toLowerCase()) &&
      (!filters.arrangement ||
        job.arrangement === filters.arrangement) &&
      (!filters.employment ||
        job.employment === filters.employment) &&
      (!filters.experience ||
        job.experience === filters.experience)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobs.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const visibleJobs = filteredJobs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasFilters = Object.values(filters).some(Boolean);

  function changePage(nextPage: number) {
    setPage(nextPage);

    document.getElementById("job-results")?.focus();
  }

  return (
    <div className="mt-7">
      <section
        aria-label="Search and filter jobs"
        className="rounded-2xl bg-white p-5 sm:p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="job-query"
              className="mb-2 block text-xs font-semibold"
            >
              Role, company, or skill
            </label>

            <input
              id="job-query"
              type="search"
              value={filters.query}
              onChange={(event) =>
                updateFilter("query", event.target.value)
              }
              placeholder="Try React or customer support"
              className={controlStyles}
            />
          </div>

          <div>
            <label
              htmlFor="job-location"
              className="mb-2 block text-xs font-semibold"
            >
              Location
            </label>

            <input
              id="job-location"
              type="search"
              value={filters.location}
              onChange={(event) =>
                updateFilter("location", event.target.value)
              }
              placeholder="City or country"
              className={controlStyles}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="job-arrangement"
              className="mb-2 block text-xs font-semibold"
            >
              Work arrangement
            </label>

            <select
              id="job-arrangement"
              value={filters.arrangement}
              onChange={(event) =>
                updateFilter("arrangement", event.target.value)
              }
              className={controlStyles}
            >
              <option value="">Any arrangement</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="job-employment"
              className="mb-2 block text-xs font-semibold"
            >
              Employment type
            </label>

            <select
              id="job-employment"
              value={filters.employment}
              onChange={(event) =>
                updateFilter("employment", event.target.value)
              }
              className={controlStyles}
            >
              <option value="">Any employment type</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="job-experience"
              className="mb-2 block text-xs font-semibold"
            >
              Experience level
            </label>

            <select
              id="job-experience"
              value={filters.experience}
              onChange={(event) =>
                updateFilter("experience", event.target.value)
              }
              className={controlStyles}
            >
              <option value="">Any level</option>
              <option value="graduate">Graduate</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
            </select>
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 min-h-11 text-sm font-medium text-violet-700 underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </section>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="job-results"
          tabIndex={-1}
          className="text-lg font-semibold outline-none"
        >
          Explore opportunities
        </h2>

        <p role="status" className="text-sm text-stone-500">
          {filteredJobs.length} sample{" "}
          {filteredJobs.length === 1 ? "job" : "jobs"} found
        </p>
      </div>

      {visibleJobs.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {visibleJobs.map((job) => (
            <article
              key={job.id}
              className="flex min-w-0 flex-col rounded-2xl border border-transparent bg-white p-5 transition-colors hover:border-violet-200 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <CompanyLogo company={job.company} src={job.logoUrl} />

                <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] text-stone-500">
                  Demo listing
                </span>
              </div>

             <h3 className="mt-4 break-words text-lg font-semibold">
  <Link
    href={`/jobs/${job.id}`}
    className="rounded-sm hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
  >
    {job.title}
  </Link>
</h3>

              <p className="mt-1 text-sm text-stone-500">
                {job.company}
              </p>

              <p className="mt-3 text-xs text-stone-500">
                {job.location}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  job.arrangement,
                  job.employment,
                  job.experience,
                ].map((value) => (
                  <span
                    key={value}
                    className="rounded-lg bg-[#f5f5f1] px-2.5 py-1 text-xs"
                  >
                    {labels[value]}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-6 text-stone-600">
                {job.summary}
              </p>

              <ul
                aria-label="Listed skills"
                className="mt-4 flex flex-wrap gap-2"
              >
                {job.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-lg bg-[#f0ebff] px-2.5 py-1 text-xs text-violet-800"
                  >
                    {skill}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5">
                <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-4">
                  <p className="text-xs text-stone-500">
                    Sample opportunity
                  </p>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-[#242332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#39364e]"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-semibold">
            No sample jobs match these filters.
          </h3>

          <p className="mt-2 text-sm text-stone-500">
            Try a broader keyword or remove a filter.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-full bg-[#242332] px-5 py-3 text-sm font-medium text-white"
          >
            Reset filters
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Job results pagination"
          className="mt-6 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
            className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-xs text-stone-500">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => changePage(currentPage + 1)}
            className="min-h-11 rounded-full bg-[#242332] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Next →
          </button>
        </nav>
      )}

      <p className="mt-7 text-xs leading-6 text-stone-500">
        Want to update your career details?{" "}
        <Link
          href="/onboarding"
          className="font-medium text-violet-700 underline underline-offset-4"
        >
          Edit your profile
        </Link>
      </p>
    </div>
  );
}