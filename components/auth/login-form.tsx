"use client";

import { useState, useEffect, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import GoogleSignInButton from "@/components/auth/google-sign-in-button";

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("auth_error") === "callback_failed") {
      // This effect initializes the form message from the OAuth callback URL.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage(
        "Sign-in could not be completed. Please try again. If you used an email link, open the newest one in the browser where you started.",
      );
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(
          error.code === "invalid_credentials"
            ? "The email or password is incorrect."
            : error.message,
        );
        return;
      }

      if (!data.session) {
        setMessage("Sign-in could not be completed. Please try again.");
        return;
      }

      form.reset();

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage(
        "We couldn’t sign you in. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyles =
    "w-full rounded-lg border border-stone-300 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <Image
          src="/images/jobplexlogo.png"
          alt="Job Plex"
          width={160}
          height={60}
          className="h-auto w-40"
        />

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-emerald-950">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-stone-600">
          Sign in to continue your next chapter.
        </p>

        <GoogleSignInButton disabled={isSubmitting} />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-500">or use your email</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="login-email"
              className="text-sm font-medium text-stone-700"
            >
              Email address
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              required
              disabled={isSubmitting}
              className={`${inputStyles} mt-2`}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-stone-700"
            >
              Password
            </label>

            <div className="relative mt-2">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                disabled={isSubmitting}
                className={`${inputStyles} pr-20`}
              />

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-4 text-xs font-medium text-emerald-800 disabled:opacity-60"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-950 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>

          <p role="status" aria-live="polite" className="text-sm text-red-700">
            {message}
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-emerald-800 underline"
          >
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
