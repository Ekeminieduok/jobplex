import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileJobs } from "@/lib/jobs/profile-jobs";
import type { LiveJob } from "@/lib/jobs/jsearch";
import LiveJobBrowser from "@/components/jobs/live-job-browser";
import PageLoader from "@/components/ui/page-loader";

async function JobsContent() {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getClaims();

  const userId = auth?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, target_role, location, skills")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error("Unable to load your profile.");
  }

  if (!profile) {
    redirect("/onboarding");
  }
  const targetRole = profile.target_role?.trim() ?? "";
  const location = profile.location?.trim() || "Nigeria";

  const skills: string[] = Array.isArray(profile.skills)
    ? profile.skills.filter(
        (skill: unknown): skill is string =>
          typeof skill === "string" && skill.trim().length > 0,
      )
    : [];

  // Prefer the user's chosen career direction.
  // Use a few skills only when no target role was supplied.
  const searchFocus = targetRole || skills.slice(0, 2).join(" ");

  const searchQuery = searchFocus
    ? `${searchFocus} jobs in ${location}`
    : `jobs in ${location}`;

let jobs: LiveJob[] = [];
let loadFailed = false;

try {
  jobs = await getProfileJobs(profile);
} catch (error) {
  loadFailed = true;

  console.error(
    "[Job Plex] Live job search failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#242332]">
      <header className="bg-[#242332]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            aria-label="Job Plex dashboard"
            className="relative block h-12 w-40 shrink-0 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
          >
            <Image
              src="/images/jobplexlogo.png"
              alt="Job Plex"
              width={200}
              height={200}
              priority
              className="pointer-events-none absolute -left-5 -top-[76px] h-[200px] w-[200px] max-w-none brightness-0 invert"
            />
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
          Your next chapter
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Find work worth exploring.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Explore opportunities across Nigeria and apply through the original
          listing. For remote roles, check the employer’s location requirements
          before applying.
        </p>

        <div className="mt-8">
          {loadFailed ? (
            <div
              role="alert"
              className="rounded-3xl border border-stone-200 bg-white p-8"
            >
              <h2 className="text-lg font-semibold">
                We couldn’t load opportunities
              </h2>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                The job service is temporarily unavailable. Please try again
                shortly.
              </p>
              <a
                href="/jobs"
                className="mt-5 inline-flex rounded-xl bg-[#d8f275] px-5 py-3 text-sm font-semibold"
              >
                Try again
              </a>
            </div>
          ) : (
            <LiveJobBrowser jobs={jobs} />
          )}
        </div>
      </section>
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<PageLoader message="Finding opportunities…" />}>
      <JobsContent />
    </Suspense>
  );
}
