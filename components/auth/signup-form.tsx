"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PendingAction = "signup" | "resend" | null;

export default function SignupForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null);

  const isBusy = pendingAction !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setMessage("");

    if (!name) {
      setMessage("Please enter your full name.");
      return;
    }

    setPendingAction("signup");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      // Clear the password while retaining the email for resending.
      const passwordInput = form.elements.namedItem("password");

      if (passwordInput instanceof HTMLInputElement) {
        passwordInput.value = "";
      }

      setShowPassword(false);

      if (data.session) {
        router.replace("/onboarding");
        router.refresh();
        return;
      }

      setMessage(
        "Check your inbox for a confirmation email. Open the newest link in this browser to continue.",
      );
    } catch {
      setMessage(
        "We couldn’t complete signup. Check your connection and try again.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function resendConfirmation() {
    if (isBusy) return;

    const emailInput = emailRef.current;

    if (!emailInput) return;

    emailInput.value = emailInput.value.trim();

    // Validate only the email, without requiring name or password.
    if (!emailInput.reportValidity()) {
      return;
    }

    setMessage("");
    setPendingAction("resend");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailInput.value,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "Confirmation requested. Check your inbox and open the newest link in this browser.",
      );
    } catch {
      setMessage(
        "We couldn’t resend the email. Check your connection and try again.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const inputStyles =
    "mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

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

        <h1 className="mt-1 text-3xl font-semibold text-emerald-950">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-stone-600">
          Discover opportunities that fit your skills and goals.
        </p>

        <button
          type="button"
          disabled={isBusy}
          onClick={() =>
            setMessage("Google sign-in is not connected yet.")
          }
          className="mt-6 w-full rounded-lg border border-stone-300 px-4 py-3 text-sm font-semibold hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-500">
            or use your email
          </span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isBusy}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium text-stone-700"
            >
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              maxLength={100}
              disabled={isBusy}
              required
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-stone-700"
            >
              Email address
            </label>

            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              disabled={isBusy}
              required
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-stone-700"
            >
              Password
            </label>

            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                minLength={8}
                disabled={isBusy}
                required
                aria-describedby="password-help"
                className="w-full rounded-lg border border-stone-300 py-3 pr-20 pl-4 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
              />

              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  setShowPassword((visible) => !visible)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-4 text-xs font-medium text-emerald-800 disabled:opacity-60"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p
              id="password-help"
              className="mt-2 text-xs text-stone-500"
            >
              Use at least 8 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-lg bg-emerald-950 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "signup"
              ? "Creating account…"
              : "Create account"}
          </button>

          <button
            type="button"
            onClick={resendConfirmation}
            disabled={isBusy}
            className="w-full text-sm text-emerald-800 underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "resend"
              ? "Sending confirmation…"
              : "Resend confirmation email"}
          </button>

          <p
            role="status"
            aria-live="polite"
            className="text-sm text-emerald-800"
          >
            {message}
          </p>
        </form>
      </section>
    </main>
  );
}