"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import LogoutButton from "@/components/auth/logout-button";

type MobileHeaderProps = {
  name: string;
  photoUrl: string | null;
};

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "My profile" },
  { href: "#skills", label: "My skills" },
  { href: "/jobs", label: "Opportunities" },
];

export default function MobileHeader({
  name,
  photoUrl,
}: MobileHeaderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(
    null,
  );

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function openMenu() {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) return;

    dialog.showModal();
    setIsOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  // Prevent background scrolling while the menu is open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Close the mobile menu when switching to desktop.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");

    function handleResize() {
      if (media.matches) {
        dialogRef.current?.close();
      }
    }

    media.addEventListener("change", handleResize);

    return () => {
      media.removeEventListener("change", handleResize);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-[#222131] px-4 py-3 text-white lg:hidden">
        {/* Logo without a background */}
        <Link
          href="/dashboard"
          aria-label="Job Plex home"
          className="relative block h-11 w-36 shrink-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
        >
          <Image
            src="/images/jobplexlogo.png"
            alt="Job Plex"
            width={180}
            height={180}
            priority
            className="pointer-events-none absolute -left-[18px] -top-[68px] h-[180px] w-[180px] max-w-none brightness-0 invert"
          />
        </Link>

        <div className="flex items-center gap-2">
          {/* Profile photo at the top right */}
          <Link
            href="#my-profile"
            aria-label="View your profile and change your photo"
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#d8f275] text-sm font-semibold text-[#222131] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
          >
            {photoUrl && photoUrl !== failedPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setFailedPhoto(photoUrl)}
              />
            ) : (
              initials
            )}
          </Link>

          <button
            ref={triggerRef}
            type="button"
            onClick={openMenu}
            aria-label="Open navigation"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-haspopup="dialog"
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-labelledby="mobile-navigation-title"
        onClose={() => {
          setIsOpen(false);

          if (
            !window.matchMedia("(min-width: 1024px)").matches
          ) {
            triggerRef.current?.focus();
          }
        }}
        onClick={(event) => {
          // Click outside the drawer.
          if (event.target === event.currentTarget) {
            closeMenu();
          }
        }}
        className="jobplex-mobile-menu fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-white backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      >
        <div className="jobplex-mobile-menu-panel ml-auto flex h-full w-[min(85vw,340px)] flex-col overflow-y-auto bg-[#222131] p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="mobile-navigation-title"
              className="text-lg font-semibold"
            >
              Your workspace
            </h2>

            <button
              type="button"
              autoFocus
              onClick={closeMenu}
              aria-label="Close navigation"
              className="flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d8f275]"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <p className="mt-3 break-words text-sm text-white/60">
            {name}
          </p>

          <nav
            aria-label="Mobile navigation"
            className="mt-8 space-y-3"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                aria-current={
                  item.href === "/dashboard"
                    ? "page"
                    : undefined
                }
                className={`flex min-h-12 items-center rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8f275] ${
                  item.href === "/dashboard"
                    ? "bg-[#d8f275] text-[#222131]"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <LogoutButton variant="header" />

            <p className="mt-5 text-xs text-white/40">
              Job Plex · Your next chapter
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}