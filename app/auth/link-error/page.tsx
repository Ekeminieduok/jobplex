import Link from "next/link";

export default function AuthLinkErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-6">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-[#242332]">
          We couldn’t verify this link
        </h1>

        <p className="mt-3 text-sm leading-7 text-stone-600">
          The link may have expired or already been used.
          Request a new email and open the newest link.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-[#242332] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Request confirmation email
          </Link>

          <Link
            href="/forgot-password"
            className="rounded-xl border border-stone-300 px-4 py-3 text-center text-sm font-semibold text-[#242332]"
          >
            Request password reset
          </Link>

          <Link
            href="/login"
            className="py-2 text-center text-sm text-violet-700 underline"
          >
            Return to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}