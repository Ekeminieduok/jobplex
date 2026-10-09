import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/signup");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Let’s build your profile</h1>

      <p className="mt-4 text-stone-600">
        Your account is verified. Next, we’ll add your skills, experience, and
        job preferences.
      </p>
    </main>
  );
}
