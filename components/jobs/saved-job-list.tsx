"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { jobSnapshot } from "@/lib/jobs/job-snapshot";
import LiveJobBrowser from "@/components/jobs/live-job-browser";
import type { LiveJob } from "@/lib/jobs/jsearch";

export default function SavedJobList({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const collected = new Map<string, LiveJob>();
        const batchSize = 100;
        let offset = 0;

        while (true) {
          const { data, error } = await supabase
            .from("saved_jobs")
            .select("job_id, snapshot")
            .eq("user_id", userId)
            .order("saved_at", { ascending: false })
            .order("job_id", { ascending: true })
            .range(offset, offset + batchSize - 1);

          if (error) throw new Error("Unable to load your saved jobs.");
          if (cancelled) return;

          for (const row of data ?? []) {
            const job = jobSnapshot(row.snapshot);

            if (!job || job.id !== row.job_id) {
              throw new Error("A saved listing could not be read.");
            }

            collected.set(job.id, job);
          }

          if (!data || data.length < batchSize) break;
          offset += batchSize;
        }

        if (!cancelled) setJobs([...collected.values()]);
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load your saved jobs.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, attempt]);

  function handleSavedChange(jobId: string, saved: boolean) {
    if (saved) return;

    setJobs((current) => current.filter((job) => job.id !== jobId));
    setMessage("Job removed from your saved list.");

    // The clicked button disappears with its card.
    requestAnimationFrame(() => {
      resultsRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div
      ref={resultsRef}
      tabIndex={-1}
      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/jobs"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#d8f275] px-4 py-3 text-sm font-semibold"
        >
          Browse opportunities
        </Link>

        <button
          type="button"
          disabled={loading}
          onClick={() => setAttempt((value) => value + 1)}
          className="min-h-11 rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium disabled:opacity-50"
        >
          Refresh saved jobs
        </button>
      </div>

      <p role="status" aria-live="polite" className="mb-3 text-sm text-violet-800">
        {message}
      </p>

      {loading ? (
        <p role="status" className="rounded-3xl bg-white p-6 text-stone-600">
          Loading your saved jobs…
        </p>
      ) : error ? (
        <div role="alert" className="rounded-3xl bg-red-50 p-6 text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 min-h-11 font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <LiveJobBrowser
          jobs={jobs}
          savedView
          onSavedChange={handleSavedChange}
        />
      )}
    </div>
  );
}