"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, LoaderCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  resumeVersion,
  suggestFromText,
} from "@/lib/resume/suggestions";

type Suggestions = ReturnType<typeof suggestFromText>;

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 20;

export default function ResumeSearchPanel({
  userId,
  disabled = false,
}: {
  userId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [sourceVersion, setSourceVersion] = useState("");
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const lock = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const busy = disabled || pending !== "";

  async function getCurrentFile() {
    const { data, error } = await supabase.storage
      .from("resumes")
      .list(userId, { search: "resume.pdf", limit: 10 });

    if (error) throw new Error("Unable to check your saved resume.");

    const file = data.find((item) => item.name === "resume.pdf");

    if (!file) throw new Error("Upload a resume first.");

    return file;
  }

  async function run(label: string, action: () => Promise<void>) {
    if (lock.current || disabled) return;

    lock.current = true;
    setPending(label);
    setMessage("");
    setError("");

    try {
      await action();
    } catch (error) {
      if (mounted.current) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      lock.current = false;

      if (mounted.current) setPending("");
    }
  }

  async function analyse() {
    await run("Reading your resume…", async () => {
      setSuggestions(null);

      const before = await getCurrentFile();
      const version = resumeVersion(before);

      const { data: blob, error } = await supabase.storage
        .from("resumes")
        .download(`${userId}/resume.pdf`);

      if (error || !blob) {
        throw new Error("Unable to download your resume for review.");
      }

      if (!blob.size || blob.size > MAX_BYTES) {
        throw new Error("Choose a non-empty PDF no larger than 10 MB.");
      }

      const bytes = new Uint8Array(await blob.arrayBuffer());

      if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
        throw new Error("This file does not appear to be a PDF.");
      }

      // Imported only after the user clicks the analysis button.
     const pdfjs = await import(
  "pdfjs-dist/legacy/build/pdf.mjs"
);

pdfjs.GlobalWorkerOptions.workerSrc =
  `/pdfjs/pdf.worker.legacy.min.mjs?v=${pdfjs.version}`;

      const task = pdfjs.getDocument({
        data: bytes,
      });

      let text = "";

      try {
        const pdf = await task.promise;

        if (pdf.numPages > MAX_PAGES) {
          throw new Error("Please use a resume with 20 pages or fewer.");
        }

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();

          text += content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");

          text += "\n";
          page.cleanup();

          if (text.length > 200_000) {
            throw new Error("This PDF contains too much text for a resume.");
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "PasswordException") {
          throw new Error("Please upload a PDF without password protection.");
        }

        throw error;
      } finally {
        await task.destroy();
      }

      if (text.replace(/\s/g, "").length < 50) {
        throw new Error(
          "We couldn't find enough readable text. " +
          "Upload a text-based PDF; scanned images aren't supported yet.",
        );
      }

      const after = await getCurrentFile();

      if (resumeVersion(after) !== version) {
        throw new Error("Your resume changed. Please analyse the new file.");
      }

      const next = suggestFromText(text);

      const { data: saved, error: savedError } = await supabase
        .from("resume_search_preferences")
        .select("source_version, approved_skills, approved_role")
        .eq("user_id", userId)
        .maybeSingle();

      if (savedError) {
        throw new Error("Unable to load your saved search preferences.");
      }

      if (!mounted.current) return;

      const sameResume = saved?.source_version === version;

      const previousSkills: string[] =
        sameResume && Array.isArray(saved?.approved_skills)
          ? saved.approved_skills
          : [];

      setSuggestions(next);
      setSourceVersion(version);
      setSelectedSkills(
        previousSkills.filter((skill) => next.skills.includes(skill)),
      );

      setSelectedRole(
        sameResume &&
        next.roles.some((role) => role.title === saved?.approved_role)
          ? saved.approved_role ?? ""
          : "",
      );

      setMessage(
        sameResume
          ? "Your saved choices are selected. Review them below."
          : "Select only the suggestions you want to use.",
      );
    });
  }

  async function save() {
    await run("Saving your choices…", async () => {
      const file = await getCurrentFile();

      if (!sourceVersion || resumeVersion(file) !== sourceVersion) {
        throw new Error("Your resume changed. Analyse it again before saving.");
      }

      const { error } = await supabase
        .from("resume_search_preferences")
        .upsert({
          user_id: userId,
          source_version: sourceVersion,
          approved_skills: selectedSkills,
          approved_role: selectedRole || null,
        });

      if (error) {
        throw new Error("Unable to save your choices. Please try again.");
      }

      if (!mounted.current) return;

      setMessage("Saved. Your dashboard and opportunities will use these choices.");
      router.refresh();
    });
  }

  async function disable() {
    await run("Removing resume search preferences…", async () => {
      const { error } = await supabase
        .from("resume_search_preferences")
        .delete()
        .eq("user_id", userId);

      if (error) {
        throw new Error("Unable to remove your search preferences.");
      }

      if (!mounted.current) return;

      setSelectedSkills([]);
      setSelectedRole("");
      setMessage("Resume-assisted searching is off. Your profile still applies.");
      router.refresh();
    });
  }

  const button =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl " +
    "px-4 py-3 text-sm font-semibold transition " +
    "focus-visible:outline-2 focus-visible:outline-offset-4 " +
    "focus-visible:outline-violet-600 disabled:cursor-not-allowed " +
    "disabled:opacity-50";

  return (
    <section
      aria-busy={busy}
      className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <FileSearch
          aria-hidden="true"
          className="mt-1 h-6 w-6 shrink-0 text-violet-700"
        />

        <div>
          <h2 className="text-lg font-semibold">Find more possibilities</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Review skills and related roles from your resume. You choose
            what influences your search; your profile remains the starting point.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={() => void analyse()}
          className={`${button} bg-[#242332] text-white hover:bg-violet-800`}
        >
          {pending === "Reading your resume…" && (
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          )}
          {suggestions ? "Analyse again" : "Analyse my resume"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void disable()}
          className={`${button} border border-stone-300 text-stone-700`}
        >
          Turn off resume-assisted search
        </button>
      </div>

      {suggestions && (
        <div className="mt-7 space-y-6">
          <fieldset disabled={busy}>
            <legend className="font-semibold">Skills to include</legend>
            <p className="mt-1 text-sm text-stone-500">
              Choose up to 20. These help order relevant listings.
            </p>

            {suggestions.skills.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.skills.map((skill) => {
                  const checked = selectedSkills.includes(skill);

                  return (
                    <label
                      key={skill}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && selectedSkills.length >= 20}
                        onChange={() =>
                          setSelectedSkills((current) =>
                            checked
                              ? current.filter((value) => value !== skill)
                              : [...current, skill],
                          )
                        }
                        className="h-4 w-4 accent-violet-700"
                      />
                      {skill}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-600">
                No skills from our current catalogue were recognised.
              </p>
            )}
          </fieldset>

          <fieldset disabled={busy} className="space-y-3">
            <legend className="mb-3 font-semibold">
              Optional additional role
            </legend>

            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="radio"
                name="resume-role"
                checked={selectedRole === ""}
                onChange={() => setSelectedRole("")}
                className="h-4 w-4 accent-violet-700"
              />
              Keep my existing role search only
            </label>

            {suggestions.roles.map((role) => (
              <label
                key={role.title}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4"
              >
                <input
                  type="radio"
                  name="resume-role"
                  checked={selectedRole === role.title}
                  onChange={() => setSelectedRole(role.title)}
                  className="mt-1 h-4 w-4 shrink-0 accent-violet-700"
                />

                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {role.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-stone-500">
                    {role.reason}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className={`${button} w-full bg-[#d8f275] text-[#242332] sm:w-auto`}
          >
            Save search choices
          </button>
        </div>
      )}

      <p role="status" aria-live="polite" className="mt-4 text-sm text-violet-800">
        {pending || message}
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-stone-500">
        Text is processed in your browser. Only approved skills and a role
        are saved. Replacing or deleting the PDF makes its previous choices inactive.
      </p>
    </section>
  );
}