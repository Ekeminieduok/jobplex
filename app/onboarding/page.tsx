import { Suspense } from "react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/logout-button";
import OnboardingForm from "@/components/forms/onboarding-form";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import PageLoader from "@/components/ui/page-loader";

async function OnboardingContent() {
  const supabase = await createClient();

  const { data: auth, error: authError } =
    await supabase.auth.getClaims();

  const userId = auth?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "full_name, location, target_role, skills, experience_level, work_arrangement, employment_type",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load your profile. Please try again.");
  }

  const metadataName = auth.claims.user_metadata?.full_name;

  const initialValues = {
    full_name:
      profile?.full_name ??
      (typeof metadataName === "string" ? metadataName : ""),
    location: profile?.location ?? "",
    target_role: profile?.target_role ?? "",
    skills: profile?.skills ?? [],
    experience_level: profile?.experience_level ?? "",
    work_arrangement: profile?.work_arrangement ?? "",
    employment_type: profile?.employment_type ?? "",
  };

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#242332]">
  <header className="border-b border-white/10 bg-[#242332]">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
      {/* Transparent logo directly against the header */}
      <Link
        href="/dashboard"
        aria-label="Job Plex home"
        className="relative block h-12 w-40 shrink-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
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

      <LogoutButton variant="header" />
    </div>
  </header>

  <section className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
    <div className="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
        A little about you
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Let’s shape your next chapter.
      </h1>

      <p className="mt-3 text-sm leading-7 text-stone-500">
        Tell us about your strengths and the work you’re looking
        for. You can update everything later.
      </p>
    </div>

    <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 lg:p-10">
      <OnboardingForm initialValues={initialValues} />
    </div>
  </section>
</main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <PageLoader message="Getting your profile ready…" />
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}