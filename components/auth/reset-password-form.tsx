"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const lockRef = useRef(false);

  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (lockRef.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const password = String(formData.get("password") ?? "");
    const confirmation = String(
      formData.get("confirmation") ?? "",
    );

    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("Your passwords don’t match.");
      return;
    }

    lockRef.current = true;
    setBusy(true);

    try {
      const supabase = createClient();

      // Recheck the session in case it expired while the form was open.
      const { data, error: userError } =
        await supabase.auth.getUser();

      if (userError || !data.user) {
        setError(
          "Your session has expired. Request a new reset email below.",
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      form.reset();
      setShowPassword(false);
      setSaved(true);
      router.refresh();
    } catch {
      setError(
        "We couldn’t update your password. Check your connection and try again.",
      );
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <div>
        <p
          role="status"
          className="rounded-xl bg-lime-50 p-4 text-sm leading-6 text-lime-900"
        >
          Your password has been updated. Use your new password the
          next time you sign in.
        </p>

        <Link
          href="/dashboard"
          className="mt-5 flex min-h-12 items-center justify-center rounded-xl bg-[#242332] px-4 py-3 text-sm font-semibold text-white"
        >
          Continue to dashboard
        </Link>
      </div>
    );
  }

  const inputClass =
    "mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 disabled:opacity-60";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        aria-busy={busy}
        className="space-y-5"
      >
        <div>
          <label htmlFor="new-password" className="text-sm font-medium">
            New password
          </label>

          <input
            id="new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
            aria-describedby="new-password-help"
            className={inputClass}
          />

          <p
            id="new-password-help"
            className="mt-2 text-xs text-stone-500"
          >
            Use at least 8 characters. A long, unique passphrase works
            well.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium"
          >
            Confirm new password
          </label>

          <input
            id="confirm-password"
            name="confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
            className={inputClass}
          />
        </div>

        <label className="inline-flex min-h-11 items-center gap-3 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showPassword}
            disabled={busy}
            onChange={(event) => setShowPassword(event.target.checked)}
            className="h-4 w-4 accent-violet-700"
          />
          Show passwords
        </label>

        <button
          type="submit"
          disabled={busy}
          className="min-h-12 w-full rounded-xl bg-[#d8f275] px-4 py-3 text-sm font-semibold text-[#242332] transition hover:bg-[#cbe660] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Updating password…" : "Save new password"}
        </button>

        {error && (
          <p role="alert" className="text-sm leading-6 text-red-700">
            {error}
          </p>
        )}
      </form>

      <Link
        href="/forgot-password"
        className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 underline underline-offset-4"
      >
        Request a new reset email
      </Link>
    </>
  );
}