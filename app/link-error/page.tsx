import Link from "next/link";
import AuthCard from "@/components/auth/auth-card";

export default function AuthLinkErrorPage() {
  return (
    <AuthCard
      title="We couldn’t verify that link"
      description="It may have expired, already been used, or verification may be temporarily unavailable. Request a fresh email and use its newest link."
    >
      <div className="space-y-3">
        <Link
          href="/forgot-password"
          className="flex min-h-12 items-center justify-center rounded-xl bg-[#d8f275] px-4 py-3 text-center text-sm font-semibold"
        >
          Request password reset
        </Link>

        <Link
          href="/signup"
          className="flex min-h-12 items-center justify-center rounded-xl border border-stone-300 px-4 py-3 text-center text-sm font-semibold"
        >
          Resend signup confirmation
        </Link>

        <Link
          href="/login"
          className="flex min-h-11 items-center justify-center text-sm font-semibold text-violet-700 underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}