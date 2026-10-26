"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, LoaderCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { jobSnapshot } from "@/lib/jobs/job-snapshot";
import type { LiveJob } from "@/lib/jobs/jsearch";

type Props = {
  job: LiveJob;
  onSavedChange?: (jobId: string, saved: boolean) => void;
};

export default function SaveJobButton({
  job,
  onSavedChange,
}: Props) {
  const [supabase] = useState(() => createClient());
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const locked = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);

  const checkSaved = useCallback(async () => {
    if (locked.current) return;

    const request = ++generation.current;

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError || !auth.user) {
        throw new Error("Please sign in to save opportunities.");
      }

      const { data, error } = await supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("user_id", auth.user.id)
        .eq("job_id", job.id)
        .maybeSingle();

      if (error) throw new Error("Unable to check this saved job.");

      if (mounted.current && request === generation.current) {
        setSaved(Boolean(data));
        setError("");
      }
    } catch (error) {
      if (mounted.current && request === generation.current) {
        setSaved(null);
        setError(
          error instanceof Error
            ? error.message
            : "Unable to check this saved job.",
        );
      }
    }
  }, [job.id, supabase]);

  useEffect(() => {
    mounted.current = true;
    void checkSaved();

    function refresh() {
      void checkSaved();
    }

    window.addEventListener("focus", refresh);
    window.addEventListener("jobplex-saved-jobs-changed", refresh);

    return () => {
      mounted.current = false;
      generation.current++;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("jobplex-saved-jobs-changed", refresh);
    };
  }, [checkSaved]);

  async function toggle() {
    if (locked.current) return;

    if (saved === null) {
      await checkSaved();
      return;
    }

    locked.current = true;
    generation.current++;
    setPending(true);
    setError("");

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError || !auth.user) {
        throw new Error("Please sign in to save opportunities.");
      }

      const nextSaved = !saved;

      if (saved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", auth.user.id)
          .eq("job_id", job.id);

        if (error) throw new Error("Unable to remove this job. Try again.");
      } else {
        const snapshot = jobSnapshot(job);

        if (!snapshot) {
          throw new Error("This listing cannot be saved.");
        }

        const { error } = await supabase
          .from("saved_jobs")
          .insert({
            user_id: auth.user.id,
            job_id: snapshot.id,
            snapshot,
          });

        // Another tab may already have saved this same job.
        if (error && error.code !== "23505") {
          throw new Error("Unable to save this job. Try again.");
        }
      }

      if (mounted.current) {
        setSaved(nextSaved);
        onSavedChange?.(job.id, nextSaved);
      }

      window.dispatchEvent(new Event("jobplex-saved-jobs-changed"));
    } catch (error) {
      if (mounted.current) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to update this saved job.",
        );
      }
    } finally {
      locked.current = false;
      if (mounted.current) setPending(false);
    }
  }

  const checking = saved === null && !error;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending || checking}
        aria-pressed={saved ?? false}
        aria-label={
          saved
            ? `Remove ${job.title} at ${job.company} from saved jobs`
            : `Save ${job.title} at ${job.company}`
        }
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-50 ${
          saved
            ? "border-violet-200 bg-violet-50 text-violet-800"
            : "border-stone-300 bg-white text-[#242332] hover:bg-stone-50"
        }`}
      >
        {pending || checking ? (
          <LoaderCircle
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <Bookmark
            aria-hidden="true"
            className="h-4 w-4"
            fill={saved ? "currentColor" : "none"}
          />
        )}

        {pending
          ? "Updating…"
          : checking
            ? "Checking…"
            : saved === null
              ? "Retry saved status"
              : saved
                ? "Saved · Remove"
                : "Save job"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}