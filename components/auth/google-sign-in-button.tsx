"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  disabled?: boolean;
};

export default function GoogleSignInButton({
  disabled = false,
}: Props) {
  const lockRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // Reset the button if the user returns with the browser Back button.
  useEffect(() => {
    function resetPending() {
      lockRef.current = false;
      setPending(false);
    }

    window.addEventListener("pageshow", resetPending);

    return () => {
      window.removeEventListener("pageshow", resetPending);
    };
  }, []);

  async function handleGoogleSignIn() {
    if (disabled || lockRef.current) return;

    lockRef.current = true;
    setPending(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;

      if (!data.url) {
        throw new Error("Unable to start Google sign-in.");
      }

      window.location.assign(data.url);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Google sign-in could not start. Please try again.",
      );

      lockRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        disabled={disabled || pending}
        aria-busy={pending}
        className="flex min-h-12 w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-[#242332] transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}