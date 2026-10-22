import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthCard({
  title,
  description,
  children,
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-4 py-10 text-[#242332]">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-[#242332] px-6 py-4 sm:px-8">
          <Link
            href="/login"
            aria-label="Job Plex sign in"
            className="relative block h-12 w-40 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
          >
            <Image
              src="/images/jobplexlogo.png"
              alt="Job Plex"
              width={200}
              height={200}
              priority
              className="pointer-events-none absolute -left-5 -top-[76px] h-[200px] w-[200px] max-w-none brightness-0 invert"
            />
          </Link>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            {description}
          </p>

          <div className="mt-7">{children}</div>
        </div>
      </section>
    </main>
  );
}