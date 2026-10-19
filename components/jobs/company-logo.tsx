"use client";

import { useState } from "react";

export default function CompanyLogo({
  company,
  src,
}: {
  company: string;
  src?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(
    null,
  );

  const initials = company
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-100 bg-[#f0ebff] text-sm font-semibold text-[#242332]">
      {src && src !== failedSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${company} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="h-full w-full bg-white object-contain p-2"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}