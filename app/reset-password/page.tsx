import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import AuthCard from "@/components/auth/auth-card";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import PageLoader from "@/components/ui/page-loader";

async function ResetPasswordContent() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/link-error?flow=recovery");
  }

  return (
    <AuthCard
      title="Choose a new password"
      description={`Update the password for ${data.user.email ?? "your account"}.`}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<PageLoader message="Preparing your password reset…" />}
    >
      <ResetPasswordContent />
    </Suspense>
  );
}