"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({
  variant = "default",
}: {
  variant?: "default" | "header";
}) {
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogout() {
    if (isPending) return;

    setIsPending(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        setMessage("Couldn’t sign out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setMessage("Couldn’t sign out. Check your connection.");
    } finally {
      setIsPending(false);
    }
  }

  const appearance =
    variant === "header"
      ? "text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-[#d8f275]"
      : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-[#242332] focus-visible:outline-violet-600";

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        aria-busy={isPending}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-50 ${appearance}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
          <path d="M14 8l4 4-4 4M8 12h10" />
        </svg>

        {isPending ? "Signing out…" : "Sign out"}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`max-w-56 text-right text-xs ${
          message ? "mt-2" : ""
        } ${
          variant === "header"
            ? "text-red-200"
            : "text-red-700"
        }`}
      >
        {message}
      </p>
    </div>
  );
}