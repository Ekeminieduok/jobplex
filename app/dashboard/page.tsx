import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageLoader from "@/components/ui/page-loader";
import LogoutButton from "@/components/auth/logout-button";
import ProfilePhoto from "@/components/dashboard/profile-photo";
import { createClient } from "@/lib/supabase/server";
import MobileHeader from "@/components/dashboard/mobile-header";
import CompanyLogo from "@/components/jobs/company-logo";
import { getProfileJobs } from "@/lib/jobs/profile-jobs";
import type { LiveJob } from "@/lib/jobs/jsearch";
import { FileText } from "lucide-react";
import Reveal from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Dashboard | Job Plex",
  description: "Your career profile and next opportunities.",
};

const labels: Record<string, string> = {
  graduate: "Graduate",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  any: "Open to any",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

// Add your JPEG to public/images/, then replace null with its path.
const dashboardArtwork: string | null = null;

const panel = "rounded-2xl bg-white p-5 sm:p-6";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: "dashboard" | "profile" | "briefcase" | "skills" | "location" | "arrow";
  className?: string;
}) {
  const paths: Record<typeof name, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="3" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a22 22 0 0 0 18 0M12 12v3" />
      </>
    ),
    skills: (
      <>
        <path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
  color,
}: {
  icon: "briefcase" | "skills" | "location";
  title: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <Reveal className="jp-card min-w-0 rounded-2xl border border-transparent bg-white p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
      >
        <Icon name={icon} />
      </div>

      <p className="mt-4 text-xs text-stone-500">{title}</p>

      <p className="mt-1 break-words text-base font-semibold leading-6">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-stone-500">{detail}</p>
    </Reveal>
  );
}

async function DashboardContent() {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getClaims();

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
    throw new Error("Unable to load your dashboard.");
  }

  if (!profile) {
    redirect("/onboarding");
  }
  let opportunities: LiveJob[] = [];
  let opportunitiesFailed = false;

  try {
    const jobs = await getProfileJobs(profile);
    opportunities = jobs.slice(0, 3);
  } catch (error) {
    opportunitiesFailed = true;

    console.error(
      "[Job Plex] Dashboard opportunities failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  const { data: photo } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(`${userId}/avatar.jpg`, 3600);

  const photoUrl = photo?.signedUrl
    ? `${photo.signedUrl}&v=${Date.now()}`
    : null;

  const firstName = profile.full_name.trim().split(/\s+/)[0];

  const preferences = [
    {
      title: "Experience level",
      value: labels[profile.experience_level] ?? profile.experience_level,
      color: "bg-[#fce8dc]",
      icon: "profile" as const,
    },
    {
      title: "Work arrangement",
      value: labels[profile.work_arrangement] ?? profile.work_arrangement,
      color: "bg-[#e9e5fc]",
      icon: "location" as const,
    },
    {
      title: "Employment type",
      value: labels[profile.employment_type] ?? profile.employment_type,
      color: "bg-[#edf5ce]",
      icon: "briefcase" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-[#242332] lg:bg-[#c5b2f5] lg:p-7">
      <div className="mx-auto min-h-screen max-w-[1540px] bg-[#f6f6f4] lg:grid lg:min-h-[calc(100vh-56px)] lg:grid-cols-[210px_minmax(0,1fr)] lg:rounded-[30px]">
        <MobileHeader name={profile.full_name} photoUrl={photoUrl} />
        {/* Sidebar */}
        <aside className="hidden p-3 pr-0 lg:block">
          <div className="flex h-full flex-col rounded-[22px] bg-[#222131] px-4 py-5 text-white">
            {/* Visually crops the padding inside the existing logo */}
            <Link
              href="/dashboard"
              aria-label="Job Plex dashboard"
              className="relative mb-6 block h-12 w-40 shrink-0 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
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

            <nav
              aria-label="Main navigation"
              className="flex flex-wrap gap-2 lg:flex-col lg:gap-3"
            >
              <Link
                href="/dashboard"
                aria-current="page"
                className="flex items-center gap-3 rounded-full bg-[#d8f275] px-4 py-3 text-sm font-semibold text-[#242332]"
              >
                <Icon name="dashboard" />
                Dashboard
              </Link>

              <Link
                href="/onboarding"
                className="flex items-center gap-3 rounded-full px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Icon name="profile" />
                My profile
              </Link>

              <a
                href="#skills"
                className="flex items-center gap-3 rounded-full px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Icon name="skills" />
                My skills
              </a>

              <a
                href="/jobs"
                className="flex items-center gap-3 rounded-full px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Icon name="briefcase" />
                Opportunities
              </a>

              <Link
                href="/resume"
                className="flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <FileText aria-hidden="true" className="h-5 w-5 shrink-0" />
                Resume
              </Link>
            </nav>

            <div className="mt-16 hidden rounded-2xl bg-[#d8f275] p-4 text-[#242332] lg:mt-auto lg:block">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <Icon name="arrow" className="h-5 w-5 -rotate-45" />
              </div>

              <p className="text-base font-semibold leading-6">
                Ready for your
                <br />
                next chapter?
              </p>

              <p className="mt-2 text-xs leading-5 text-[#454735]">
                Keep your profile fresh as your ambitions grow.
              </p>

              <Link
                href="/onboarding"
                className="mt-4 inline-block text-xs font-semibold underline underline-offset-4"
              >
                Update your profile
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 p-5 sm:p-7 lg:p-7 xl:p-9">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <Reveal>
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, {firstName}
                <span className="ml-2" aria-hidden="true">
                  👋
                </span>
              </h1>

              <p className="mt-2 text-sm text-stone-500">
                Let’s make your next career move count.
              </p>
            </Reveal>

            <div className="hidden lg:block">
              <LogoutButton />
            </div>
          </header>

          <div className="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
            {/* Main column */}
            <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-5">
              <section aria-labelledby="overview-title">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 id="overview-title" className="text-base font-semibold">
                    Your career overview
                  </h2>

                  <Link
                    href="/onboarding"
                    className="text-xs text-stone-500 underline underline-offset-4 hover:text-[#242332]"
                  >
                    Edit details
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard
                    icon="briefcase"
                    title="Target role"
                    value={profile.target_role}
                    detail="Your next opportunity"
                    color="bg-[#fce8dc]"
                  />

                  <SummaryCard
                    icon="skills"
                    title="Your strengths"
                    value={`${profile.skills.length} skills`}
                    detail="Added to your career profile"
                    color="bg-[#edf5ce]"
                  />

                  <SummaryCard
                    icon="location"
                    title="Based in"
                    value={profile.location}
                    detail="Your current location"
                    color="bg-[#e9e5fc]"
                  />
                </div>
              </section>

              <div className="order-3 grid items-start gap-5 md:grid-cols-2 xl:order-none">
                {/* Profile */}
                <Reveal className="min-w-0">
                  <section className={`${panel} scroll-mt-24`} id="my-profile">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold">My profile</h2>

                      <span className="rounded-full bg-[#edf5ce] px-2.5 py-1 text-[11px] font-medium text-[#586b23]">
                        Saved
                      </span>
                    </div>

                    <div className="mt-5">
                      <ProfilePhoto
                        name={profile.full_name}
                        initialUrl={photoUrl}
                      />
                    </div>

                    <h3 className="mt-3 break-words text-lg font-semibold">
                      {profile.full_name}
                    </h3>

                    <p className="mt-1 break-words text-sm text-stone-500">
                      {profile.target_role}
                    </p>

                    <p className="mt-2 break-words text-xs text-stone-500">
                      {profile.location}
                    </p>

                    <Link
                      href="/onboarding"
                      className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-medium"
                    >
                      Manage profile
                      <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  </section>
                </Reveal>

                {/* Preferences */}
                <Reveal delay={0.06} className="min-w-0">
                  <section className={panel}>
                    <h2 className="text-base font-semibold">
                      Work preferences
                    </h2>

                    <dl className="mt-5 space-y-5">
                      {preferences.map((item) => (
                        <div
                          key={item.title}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                          >
                            <Icon name={item.icon} className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <dt className="text-xs text-stone-500">
                              {item.title}
                            </dt>

                            <dd className="mt-1 break-words text-sm font-medium">
                              {item.value}
                            </dd>
                          </div>
                        </div>
                      ))}
                    </dl>

                    <Link
                      href="/onboarding"
                      className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-medium"
                    >
                      Refine preferences
                      <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  </section>
                </Reveal>
              </div>

              {/* Skills */}
              <Reveal>
                <section id="skills" className={`${panel} scroll-mt-6`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">
                      Skills you bring
                    </h2>

                    <span className="text-xs text-stone-500">
                      {profile.skills.length} added
                    </span>
                  </div>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, index: number) => (
                      <li
                        key={skill}
                        className={`max-w-full break-words rounded-xl px-4 py-2.5 text-sm font-medium ${
                          index % 3 === 0
                            ? "bg-[#edf5ce]"
                            : index % 3 === 1
                              ? "bg-[#e9e5fc]"
                              : "bg-[#fce8dc]"
                        }`}
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>

              {/* Job discovery */}
              <Reveal className="order-last min-w-0 xl:order-2">
                <section
                  id="opportunities"
                  className=" min-w-0 scroll-mt-24 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 "
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[#242332]">
                        Opportunities for you
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        Based on your target role, location and skills.
                      </p>
                    </div>

                    <Link
                      href="/jobs"
                      className="jp-action shrink-0 rounded-full bg-[#d8f275] px-4 py-2 text-xs font-semibold text-[#242332] transition hover:bg-[#cbe660] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
                    >
                      Browse all ↗
                    </Link>
                  </div>

                  <div className="mt-5">
                    {opportunitiesFailed ? (
                      <div
                        role="status"
                        className="rounded-2xl bg-stone-50 p-5"
                      >
                        <p className="text-sm font-medium text-[#242332]">
                          Opportunities couldn’t load
                        </p>

                        <p className="mt-2 text-sm leading-6 text-stone-500">
                          Please try the jobs page again shortly.
                        </p>

                        <Link
                          href="/jobs"
                          className="mt-3 inline-block text-sm font-semibold text-violet-700 underline underline-offset-4"
                        >
                          Open jobs
                        </Link>
                      </div>
                    ) : opportunities.length === 0 ? (
                      <div className="rounded-2xl bg-stone-50 p-5">
                        <p className="text-sm font-medium text-[#242332]">
                          No opportunities found yet
                        </p>

                        <p className="mt-2 text-sm leading-6 text-stone-500">
                          Review your target role and location to help us find
                          relevant openings.
                        </p>

                        <Link
                          href="/onboarding"
                          className="mt-3 inline-block text-sm font-semibold text-violet-700 underline underline-offset-4"
                        >
                          Review your profile
                        </Link>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {opportunities.map((job) => (
                          <li key={job.id}>
                            <article className="jp-card min-w-0 rounded-2xl border border-stone-200 p-4 transition hover:border-violet-300">
                              <div className="flex items-start gap-3">
                                <div className="shrink-0">
                                  <CompanyLogo
                                    company={job.company}
                                    src={job.logoUrl}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-xs text-stone-500">
                                    {job.company}
                                  </p>

                                  <h3 className="mt-1 break-words text-sm font-semibold leading-6 text-[#242332]">
                                    {job.title}
                                  </h3>

                                  <p className="mt-1 break-words text-xs leading-5 text-stone-500">
                                    {job.location}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                                  {job.employment}
                                </span>

                                {job.remote && (
                                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs text-violet-800">
                                    Remote
                                  </span>
                                )}

                                {job.searchScope === "nationwide" && (
                                  <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs text-lime-900">
                                    Across Nigeria
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 break-words text-xs text-stone-500">
                                Source: {job.source}
                              </p>

                              {job.applyUrl ? (
                                <a
                                  href={job.applyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`View and apply for ${job.title} at ${job.company} (opens in a new tab)`}
                                  className="jp-action mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#242332] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
                                >
                                  View & apply ↗
                                </a>
                              ) : (
                                <p className="mt-3 text-xs text-stone-500">
                                  Application link unavailable
                                </p>
                              )}
                            </article>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </Reveal>
            </div>

            {/* Right column */}
            <aside className="order-4 space-y-5 xl:order-none xl:col-start-2 xl:row-start-1 xl:row-span-4">
              <section className="relative overflow-hidden rounded-2xl bg-[#222131] p-5 text-white">
                {dashboardArtwork && (
                  <>
                    <Image
                      src={dashboardArtwork}
                      alt=""
                      fill
                      sizes="290px"
                      className="object-cover"
                    />

                    <div className="absolute inset-0 bg-[#222131]/85" />
                  </>
                )}

                <div
                  aria-hidden="true"
                  className="absolute -right-8 top-5 h-28 w-28 rounded-full border-[20px] border-[#d8f275]/15"
                />

                <div className="relative">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8f275]">
                    Your next chapter
                  </p>

                  <h2 className="mt-4 max-w-[190px] text-2xl font-semibold leading-tight">
                    Big ambitions.
                    <br />
                    Better beginnings.
                  </h2>

                  <p className="mt-3 max-w-[210px] text-xs leading-6 text-white/65">
                    Make sure your profile reflects where you want to go next.
                  </p>

                  <Link
                    href="/onboarding"
                    className="jp-action mt-5 inline-flex items-center gap-2 rounded-full bg-[#d8f275] px-4 py-2.5 text-xs font-semibold text-[#242332] hover:bg-[#e5fa9f]"
                  >
                    Refine my profile
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </div>
              </section>

              <section className={panel}>
                <h2 className="text-base font-semibold">Your career focus</h2>

                <p className="mt-2 text-xs leading-6 text-stone-500">
                  A quick snapshot of what you’re looking for.
                </p>

                <div className="mt-5 rounded-xl bg-[#f7f7f2] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    Next role
                  </p>

                  <p className="mt-2 break-words text-sm font-semibold">
                    {profile.target_role}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px]">
                      {labels[profile.experience_level] ??
                        profile.experience_level}
                    </span>

                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px]">
                      {labels[profile.work_arrangement] ??
                        profile.work_arrangement}
                    </span>
                  </div>
                </div>
              </section>

              <section className={panel}>
                <h2 className="text-base font-semibold">Next steps</h2>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf5ce] text-xs text-[#586b23]">
                      ✓
                    </span>

                    <div>
                      <p className="text-sm font-medium">
                        Career profile saved
                      </p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        Your details are ready.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/onboarding"
                    className="flex items-start gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9e5fc] text-xs">
                      ↗
                    </span>

                    <div>
                      <p className="text-sm font-medium">
                        Review your preferences
                      </p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        Keep your next move in focus.
                      </p>
                    </div>
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoader message="Preparing your dashboard…" />}>
      <DashboardContent />
    </Suspense>
  );
}
