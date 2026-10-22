"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const lockRef = useRef(false);

  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (lockRef.current) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    lockRef.current = true;
    setBusy(true);
    setError("");
    setSent(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/confirm`,
        },
      );

      if (error) {
        setError(
          error.status === 429
            ? "Please wait a little before requesting another email."
            : "We couldn’t send the reset email. Please try again shortly.",
        );
        return;
      }

      setSent(true);
    } catch {
      setError(
        "Check your connection and try requesting the email again.",
      );
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        aria-busy={busy}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="recovery-email"
            className="text-sm font-medium"
          >
            Email address
          </label>

          <input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={busy}
            placeholder="you@example.com"
            className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="min-h-12 w-full rounded-xl bg-[#d8f275] px-4 py-3 text-sm font-semibold text-[#242332] transition hover:bg-[#cbe660] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? "Sending…"
            : sent
              ? "Send another reset email"
              : "Send reset email"}
        </button>

        {error && (
          <p role="alert" className="text-sm leading-6 text-red-700">
            {error}
          </p>
        )}

        {sent && (
          <p
            role="status"
            className="rounded-xl bg-violet-50 p-4 text-sm leading-6 text-violet-900"
          >
            If this address has an eligible account, you’ll receive a
            password reset email. Check your inbox and spam folder,
            then open the newest link.
          </p>
        )}
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </>
  );
}