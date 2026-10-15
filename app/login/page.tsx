import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";
import PageLoader from "@/components/ui/page-loader";

export const metadata: Metadata = {
  title: "Sign in | Job Plex",
  description: "Sign in to continue building your Job Plex profile.",
};

async function LoginContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims?.sub) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense
  fallback={<PageLoader message="Checking your session…" />}
>
  <LoginContent />
</Suspense>
  );
}