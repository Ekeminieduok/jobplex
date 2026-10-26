"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  Menu,
  Sparkles,
  UserRound,
   Bookmark,
  X,
} from "lucide-react";

import LogoutButton from "@/components/auth/logout-button";

type MobileHeaderProps = {
  name: string;
  photoUrl: string | null;
};

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/onboarding",
    label: "My profile",
    icon: UserRound,
  },
  {
    href: "/dashboard#skills",
    label: "My skills",
    icon: Sparkles,
  },
  {
    href: "/jobs",
    label: "Opportunities",
    icon: BriefcaseBusiness,
  },
  {
    href: "/saved-jobs",
    label: "Saved jobs",
    icon: Bookmark,
  },
  {
    href: "/resume",
    label: "Resume",
    icon: FileText,
  },
];

export default function MobileHeader({
  name,
  photoUrl,
}: MobileHeaderProps) {
  const pathname = usePathname();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);
  const restoreFocusRef = useRef(true);

  const [isOpen, setIsOpen] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(
    null,
  );

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "JP";

  function prefersReducedMotion() {
    return window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }

  function clearAnimationStyles() {
    const panel = panelRef.current;

    if (panel) {
      gsap.set(panel, { clearProps: "transform,opacity" });
      gsap.set(panel.querySelectorAll("[data-menu-reveal]"), {
        clearProps: "transform,opacity",
      });
    }

    if (backdropRef.current) {
      gsap.set(backdropRef.current, {
        clearProps: "opacity",
      });
    }
  }

  function finishClose() {
    closingRef.current = false;
    dialogRef.current?.close();
  }

  function closeImmediately(restoreFocus = true) {
    restoreFocusRef.current = restoreFocus;
    animationRef.current?.kill();
    animationRef.current = null;
    finishClose();
  }

  function openMenu() {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;

    if (!dialog || !panel || !backdrop || dialog.open) return;

    animationRef.current?.kill();
    closingRef.current = false;
    restoreFocusRef.current = true;

    clearAnimationStyles();
    dialog.showModal();
    setIsOpen(true);

    if (prefersReducedMotion()) return;

    const items = panel.querySelectorAll("[data-menu-reveal]");

    animationRef.current = gsap
      .timeline()
      .fromTo(
        backdrop,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.22,
          ease: "power2.out",
        },
        0,
      )
      .fromTo(
        panel,
        { xPercent: 100 },
        {
          xPercent: 0,
          duration: 0.38,
          ease: "power3.out",
        },
        0,
      )
      .fromTo(
        items,
        { x: 16, opacity: 0.65 },
        {
          x: 0,
          opacity: 1,
          duration: 0.28,
          stagger: 0.045,
          ease: "power2.out",
        },
        0.08,
      );
  }

  function closeMenu() {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;

    if (!dialog?.open || closingRef.current) return;

    restoreFocusRef.current = true;
    animationRef.current?.kill();

    if (!panel || !backdrop || prefersReducedMotion()) {
      finishClose();
      return;
    }

    closingRef.current = true;

    animationRef.current = gsap
      .timeline({
        onComplete: finishClose,
      })
      .to(
        panel,
        {
          xPercent: 100,
          duration: 0.22,
          ease: "power2.in",
        },
        0,
      )
      .to(
        backdrop,
        {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
        },
        0,
      );
  }

  // Lock the background while the modal is open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Close immediately when crossing into the desktop layout.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");

    function handleResize() {
      if (!media.matches) return;

      animationRef.current?.kill();
      animationRef.current = null;
      closingRef.current = false;
      restoreFocusRef.current = false;
      dialogRef.current?.close();
    }

    media.addEventListener("change", handleResize);

    return () => {
      media.removeEventListener("change", handleResize);
    };
  }, []);

  // Clean up on unmount or when Next.js hides this page.
  useEffect(() => {
    const dialog = dialogRef.current;

    return () => {
      animationRef.current?.kill();
      animationRef.current = null;
      closingRef.current = false;
      restoreFocusRef.current = false;
      dialog?.close();
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-[#222131] px-4 py-3 text-white lg:hidden">
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
          <Link
            href="/dashboard#my-profile"
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
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8f275]"
          >
            <Menu aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-labelledby="mobile-navigation-title"
        onCancel={(event) => {
          // Let the closing animation finish before closing the dialog.
          event.preventDefault();
          closeMenu();
        }}
        onClose={() => {
          animationRef.current?.kill();
          animationRef.current = null;
          closingRef.current = false;
          setIsOpen(false);

          if (
            restoreFocusRef.current &&
            !window.matchMedia("(min-width: 1024px)").matches
          ) {
            triggerRef.current?.focus({ preventScroll: true });
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-white backdrop:bg-transparent"
      >
        <div
          ref={backdropRef}
          aria-hidden="true"
          onClick={closeMenu}
          className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        />

        <div
          ref={panelRef}
          className="relative ml-auto flex h-full w-[min(88vw,360px)] flex-col overflow-y-auto overscroll-contain bg-[#222131] px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8f275]">
                Job Plex
              </p>

              <h2
                id="mobile-navigation-title"
                className="mt-2 text-lg font-semibold"
              >
                Your workspace
              </h2>
            </div>

            <button
              type="button"
              autoFocus
              onClick={closeMenu}
              aria-label="Close navigation"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8f275]"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div
            data-menu-reveal
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <p className="text-xs text-white/55">
              Welcome back
            </p>
            <p className="mt-1 break-words text-sm font-medium">
              {name}
            </p>
          </div>

          <nav
            aria-label="Mobile navigation"
            className="my-6 space-y-2"
          >
            {navigation.map((item) => {
              const Icon = item.icon;

              // Hash links represent sections, not separate pages.
              const active =
                !item.href.includes("#") &&
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close immediately so navigation and anchor scrolling
                    // aren't delayed by the drawer animation.
                    closeImmediately(false);
                  }}
                  aria-current={active ? "page" : undefined}
                  data-menu-reveal
                  className={`group flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8f275] ${
                    active
                      ? "bg-[#d8f275] text-[#222131]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0"
                  />

                  <span className="flex-1">{item.label}</span>

                  <ArrowUpRight
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 ${
                      active ? "opacity-70" : "opacity-40"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-5">
            <LogoutButton variant="header" />

            <p className="mt-5 text-xs text-white/45">
              Job Plex · Your next chapter
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}