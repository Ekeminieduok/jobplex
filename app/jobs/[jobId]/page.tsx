import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import CompanyLogo from "@/components/jobs/company-logo";
import PageLoader from "@/components/ui/page-loader";
import { sampleJobs } from "@/lib/jobs/sample-jobs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Job details | Job Plex",
  description: "Explore the role and its listed skills.",
};

type PageProps = {
  params: Promise<{ jobId: string }>;
};

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

async function JobDetailsContent({ params }: PageProps) {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getClaims();

  const userId = auth?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load this page. Please try again.");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const { jobId } = await params;
  const job = sampleJobs.find((item) => item.id === jobId);

  if (!job) {
    notFound();
  }

  const facts = [
    { label: "Location", value: job.location },
    {
      label: "Work arrangement",
      value: labels[job.arrangement],
    },
    {
      label: "Employment type",
      value: labels[job.employment],
    },
    {
      label: "Experience",
      value: labels[job.experience],
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f6f4] px-5 py-8 text-[#242332] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/jobs"
          className="inline-flex min-h-11 items-center text-sm font-medium text-stone-600 hover:text-violet-700"
        >
          ← Back to jobs
        </Link>

        <div className="mt-5 rounded-xl bg-[#edf5ce] px-4 py-3 text-xs leading-6 text-[#465526]">
          Demo listing: this is a fictional role for testing. Applications are
          unavailable.
        </div>

        <section className="mt-5 rounded-3xl bg-white p-6 sm:p-8">
          <CompanyLogo company={job.company} src={job.logoUrl} />

          <h1 className="mt-5 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
            {job.title}
          </h1>

          <p className="mt-3 text-sm text-stone-500">
            {job.company} · {job.location}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[job.arrangement, job.employment, job.experience].map((value) => (
              <span
                key={value}
                className="rounded-full bg-[#f0ebff] px-3 py-1.5 text-xs text-violet-800"
              >
                {labels[value]}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-6 sm:p-8">
              <h2 className="text-lg font-semibold">About the role</h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-stone-600">
                {(job.description?.length
                  ? job.description
                  : [job.summary]
                ).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Listed skills</h2>

              <ul className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-xl bg-[#edf5ce] px-3 py-2 text-sm"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>

            {job.requirements && job.requirements.length > 0 && (
              <section className="rounded-2xl bg-white p-6 sm:p-8">
                <h2 className="text-lg font-semibold">Requirements</h2>

                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-stone-600">
                  {job.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="rounded-2xl bg-white p-6 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold">Role overview</h2>

            <dl className="mt-5 space-y-5">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs text-stone-500">{fact.label}</dt>

                  <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-stone-100 pt-5">
              <p className="text-sm font-medium">Preview only</p>

              <p className="mt-2 text-xs leading-6 text-stone-500">
                Real listings will link to the employer’s or provider’s
                application page.
              </p>

              <Link
                href="/jobs"
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#242332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#39364e]"
              >
                Explore more roles →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function JobDetailsPage(props: PageProps) {
  return (
    <Suspense fallback={<PageLoader message="Opening this opportunity…" />}>
      <JobDetailsContent {...props} />
    </Suspense>
  );
}
