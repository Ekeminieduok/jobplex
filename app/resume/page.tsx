import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import PageLoader from "@/components/ui/page-loader";
import ResumeManager from "@/components/resume/resume-manager";

async function ResumeContent() {
  const supabase = await createClient();

  const { data: auth, error: authError } =
    await supabase.auth.getClaims();

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
    throw new Error("Unable to load your profile.");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#242332]">
      <header className="bg-[#242332]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
            className="rounded-full border border-white/20 px-3 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
          Ready for your next opportunity
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your resume, within reach.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
          Keep your latest CV here so it’s easy to view and download
          when you’re ready to apply.
        </p>

        <div className="mt-8">
          <ResumeManager key={userId} userId={userId} />
        </div>
      </section>
    </main>
  );
}

export default function ResumePage() {
  return (
    <Suspense
      fallback={<PageLoader message="Getting your resume ready…" />}
    >
      <ResumeContent />
    </Suspense>
  );
}