import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import MobileHeader from "@/components/dashboard/mobile-header";
import LogoutButton from "@/components/auth/logout-button";
import PageLoader from "@/components/ui/page-loader";
import SavedJobList from "@/components/jobs/saved-job-list";

export const metadata: Metadata = {
  title: "Saved jobs | Job Plex",
  description: "Return to the opportunities you have saved.",
};

async function SavedJobsContent() {
  const supabase = await createClient();

  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError || !auth.user) redirect("/login");

  const userId = auth.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  const metadataName = auth.user.user_metadata?.full_name;

  const name =
    profile?.full_name ||
    (typeof metadataName === "string" ? metadataName : "Your account");

  const { data: photo } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(`${userId}/avatar.jpg`, 3600);

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-[#242332]">
      <MobileHeader
        name={name}
        photoUrl={photo?.signedUrl ?? null}
      />

      <header className="hidden bg-[#222131] text-white lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <Link
            href="/dashboard"
            aria-label="Job Plex dashboard"
            className="relative block h-12 w-40 shrink-0 overflow-hidden"
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

          <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="hover:text-[#d8f275]">
              Dashboard
            </Link>
            <Link href="/jobs" className="hover:text-[#d8f275]">
              Opportunities
            </Link>
            <Link
              href="/saved-jobs"
              aria-current="page"
              className="font-semibold text-[#d8f275]"
            >
              Saved jobs
            </Link>
            <Link href="/resume" className="hover:text-[#d8f275]">
              Resume
            </Link>
          </nav>

          <LogoutButton variant="header" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Bookmark aria-hidden="true" className="h-7 w-7 text-violet-700" />
            <h1 className="text-3xl font-semibold tracking-tight">
              Saved jobs
            </h1>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Keep promising opportunities close. These are the details saved
            when you bookmarked each listing; check the original application
            page to confirm the role is still open.
          </p>
        </div>

        <SavedJobList userId={userId} />
      </main>
    </div>
  );
}

export default function SavedJobsPage() {
  return (
    <Suspense fallback={<PageLoader message="Getting your saved jobs ready…" />}>
      <SavedJobsContent />
    </Suspense>
  );
}