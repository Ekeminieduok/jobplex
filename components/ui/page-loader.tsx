import Image from "next/image";

export default function PageLoader({
  message = "Preparing your workspace…",
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-hidden bg-[#242332] text-white"
    >
      {/* Background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-[#b69ae9]/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center px-6">
        {/* Crops the empty space inside your existing logo */}
        <div className="relative h-[72px] w-60 overflow-hidden motion-safe:animate-[pulse_2.5s_ease-in-out_infinite]">
          <Image
            src="/images/jobplexlogo.png"
            alt=""
            width={300}
            height={300}
            priority
            className="absolute -left-[30px] -top-[114px] h-[300px] w-[300px] max-w-none brightness-0 invert"
          />
        </div>

        {/* Loading track */}
        <div
          aria-hidden="true"
          className="mt-7 h-1 w-44 overflow-hidden rounded-full bg-white/10"
        >
          <div className="jobplex-loading-bar h-full w-16 rounded-full bg-[#d8f275]" />
        </div>

        <p
          aria-hidden="true"
          className="mt-5 text-center text-xs tracking-wide text-white/60"
        >
          {message}
        </p>
      </div>
    </div>
  );
}