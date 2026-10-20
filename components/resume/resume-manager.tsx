"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ResumeInfo = {
  updatedAt: string;
  size: number;
};

const MAX_SIZE = 10 * 1024 * 1024;

export default function ResumeManager({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [resume, setResume] = useState<ResumeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const operationRef = useRef(false);
  const path = `${userId}/resume.pdf`;

  useEffect(() => {
    let cancelled = false;

    async function loadResume() {
      try {
        const { data, error } = await supabase.storage
          .from("resumes")
          .list(userId, {
            search: "resume.pdf",
            limit: 10,
          });

        if (error) throw error;

        const file = data.find((item) => item.name === "resume.pdf");

        if (!cancelled) {
      setResume(
  file
    ? {
        updatedAt: file.updated_at ?? file.created_at ?? "",
        size: Number(file.metadata?.size ?? 0),
      }
    : null,
);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load your resume.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadResume();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  async function runOperation(action: () => Promise<void>) {
    if (operationRef.current) return;

    operationRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  }

  async function uploadResume(file: File) {
    await runOperation(async () => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Please choose a PDF file.");
      }

      if (file.size === 0 || file.size > MAX_SIZE) {
        throw new Error("Choose a non-empty PDF no larger than 10 MB.");
      }

      // Basic client-side format check, not a full PDF security scan.
      const signature = new TextDecoder().decode(
        await file.slice(0, 5).arrayBuffer(),
      );

      if (signature !== "%PDF-") {
        throw new Error("This file does not appear to be a PDF.");
      }

      const { error } = await supabase.storage
        .from("resumes")
        .upload(path, file, {
          upsert: true,
          contentType: "application/pdf",
          cacheControl: "0",
        });

      if (error) throw error;

      setResume({
        updatedAt: new Date().toISOString(),
        size: file.size,
      });
      setPreviewUrl("");
      setDownloadUrl("");
      setMessage("Your resume has been saved.");
    });
  }

  async function preparePreview() {
    await runOperation(async () => {
      const bucket = supabase.storage.from("resumes");

      const [view, download] = await Promise.all([
        bucket.createSignedUrl(path, 600),
        bucket.createSignedUrl(path, 600, {
          download: "resume.pdf",
        }),
      ]);

      if (view.error) throw view.error;
      if (download.error) throw download.error;

      // Avoid reusing a previous preview after replacing the file.
      setPreviewUrl(`${view.data.signedUrl}&v=${Date.now()}`);
      setDownloadUrl(download.data.signedUrl);
    //   setMessage("Your PDF is ready. These links work for 10 minutes.");
    });
  }

  async function deleteResume() {
    if (!window.confirm("Delete your saved resume?")) return;

    await runOperation(async () => {
      const { error } = await supabase.storage
        .from("resumes")
        .remove([path]);

      if (error) throw error;

      setResume(null);
      setPreviewUrl("");
      setDownloadUrl("");
      setMessage("Your resume has been deleted.");
    });
  }

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-5">
      <section
        aria-busy={busy || loading}
        className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-8"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          aria-label="Choose your resume PDF"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) void uploadResume(file);
          }}
        />

        {loading ? (
          <p role="status" className="text-sm text-stone-500">
            Loading your resume…
          </p>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xs font-bold text-violet-800"
              >
                PDF
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-semibold">
                  {resume ? "Your saved resume" : "Add your resume"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-stone-500">
                  {resume
                    ? `resume.pdf · ${(resume.size / 1024 / 1024).toFixed(2)} MB`
                    : "Upload a PDF up to 10 MB. You can replace it anytime."}
                </p>

                {resume?.updatedAt && (
                  <p className="mt-1 text-xs text-stone-500">
                    Updated{" "}
                    {new Date(resume.updatedAt).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className={`${buttonClass} bg-[#d8f275] text-[#242332] hover:bg-[#cbe660]`}
              >
                {resume ? "Replace PDF" : "Upload PDF"}
              </button>

              {resume && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void preparePreview()}
                    className={`${buttonClass} bg-[#242332] text-white hover:bg-violet-800`}
                  >
                    {previewUrl ? "Refresh PDF links" : "View resume"}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteResume()}
                    className={`${buttonClass} border border-red-200 text-red-700 hover:bg-red-50`}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {busy && (
          <p role="status" className="mt-4 text-sm text-stone-500">
            Working…
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="mt-4 text-sm text-violet-800">
            {message}
          </p>
        )}
      </section>

      {resume && previewUrl && (
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-5">
            <h2 className="font-semibold">Resume preview</h2>

            <div className="flex flex-wrap gap-3">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClass} bg-[#242332] text-white`}
              >
                Open PDF ↗
              </a>

              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClass} border border-stone-300 text-[#242332]`}
              >
                Download
              </a>
            </div>
          </div>

          <p className="p-5 text-sm leading-6 text-stone-500 lg:hidden">
            Tap Open PDF to view your resume in your device’s PDF
            viewer.
          </p>

          <div className="hidden lg:block">
            <iframe
              key={previewUrl}
              src={previewUrl}
              title="Your resume PDF preview"
              className="h-[75vh] min-h-[500px] w-full border-0"
            />
            <p className="p-4 text-xs text-stone-500">
              If the preview is blank, use Open PDF or Download.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}