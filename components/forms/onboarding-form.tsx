"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { saveProfile } from "@/actions/profile";

export type ProfileValues = {
  full_name: string;
  location: string;
  target_role: string;
  skills: string[];
  experience_level: string;
  work_arrangement: string;
  employment_type: string;
};

type FieldErrors = Partial<Record<keyof ProfileValues, string>>;

type ChoiceOption = {
  value: string;
  label: string;
  detail?: string;
};

const steps = [
  {
    title: "About you",
    description: "Let’s start with an introduction.",
  },
  {
    title: "Your career",
    description: "Show us where your strengths lie.",
  },
  {
    title: "Your preferences",
    description: "What does your ideal opportunity look like?",
  },
];

const experienceOptions: ChoiceOption[] = [
  {
    value: "graduate",
    label: "Graduate",
    detail: "Starting my career",
  },
  {
    value: "junior",
    label: "Junior",
    detail: "Building experience",
  },
  {
    value: "mid",
    label: "Mid-level",
    detail: "Confident in my craft",
  },
  {
    value: "senior",
    label: "Senior",
    detail: "Bringing deep experience",
  },
];

const workOptions: ChoiceOption[] = [
  {
    value: "remote",
    label: "Remote",
    detail: "Work remotely where eligible",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    detail: "A mix of home and office",
  },
  {
    value: "onsite",
    label: "On-site",
    detail: "Work with the team in person",
  },
  {
    value: "any",
    label: "Open to any",
    detail: "Keep my options open",
  },
];

const employmentOptions: ChoiceOption[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "any", label: "Open to any" },
];

const inputStyles =
  "mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#242332] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60";

const primaryButtonStyles =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#242332] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#39364e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:cursor-wait disabled:opacity-60";

function TextField({
  name,
  label,
  value,
  placeholder,
  maxLength,
  autoComplete,
  error,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  autoComplete?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        required
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputStyles}
      />

      {error && (
        <p id={`${name}-error`} className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceGroup({
  name,
  label,
  value,
  options,
  error,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: ChoiceOption[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-sm font-semibold">{label}</legend>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />

            <span className="flex h-full items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 transition-colors peer-checked:border-[#9680d8] peer-checked:bg-[#f0ebff] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-violet-600">
              <span>
                <span className="block text-sm font-medium">
                  {option.label}
                </span>

                {option.detail && (
                  <span className="mt-1 block text-xs leading-5 text-stone-500">
                    {option.detail}
                  </span>
                )}
              </span>

              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                  value === option.value
                    ? "border-[#242332] bg-[#242332] text-white"
                    : "border-stone-300"
                }`}
              >
                {value === option.value ? "✓" : ""}
              </span>
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p id={`${name}-error`} className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function validateStep(step: number, values: ProfileValues): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 0) {
    if (!values.full_name.trim() || values.full_name.trim().length > 100) {
      errors.full_name = "Enter your name, up to 100 characters.";
    }

    if (!values.location.trim() || values.location.trim().length > 150) {
      errors.location = "Enter your city and country, up to 150 characters.";
    }
  }

  if (step === 1) {
    if (!values.target_role.trim() || values.target_role.trim().length > 150) {
      errors.target_role = "Enter a target role, up to 150 characters.";
    }

    if (
      values.skills.length < 1 ||
      values.skills.length > 30 ||
      values.skills.some((skill) => !skill.trim() || skill.length > 60)
    ) {
      errors.skills = "Add 1–30 skills, each up to 60 characters.";
    }

    if (
      !experienceOptions.some(
        (option) => option.value === values.experience_level,
      )
    ) {
      errors.experience_level = "Choose your experience level.";
    }
  }

  if (step === 2) {
    if (
      !workOptions.some((option) => option.value === values.work_arrangement)
    ) {
      errors.work_arrangement = "Choose a work arrangement.";
    }

    if (
      !employmentOptions.some(
        (option) => option.value === values.employment_type,
      )
    ) {
      errors.employment_type = "Choose an employment type.";
    }
  }

  return errors;
}

export default function OnboardingForm({
  initialValues,
}: {
  initialValues: ProfileValues;
}) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const savingLock = useRef(false);
  const savedRef = useRef(false);

  const [values, setValues] = useState<ProfileValues>(() => ({
    ...initialValues,
    skills: Array.from(
      new Set(
        initialValues.skills
          .map((skill) => skill.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  }));

  const [step, setStep] = useState(0);
  const [skillDraft, setSkillDraft] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const duration = reducedMotion ? 0 : 0.2;

  // Clear the success screen when Next.js hides this page.
  // Preserve field values so returning users can edit them.
  useLayoutEffect(() => {
    return () => {
      if (savedRef.current) {
        savedRef.current = false;
        setIsSaved(false);
        setStep(0);
        setErrors({});
        setMessage("");
      }
    };
  }, []);

  // Focus the current heading after step or status changes.
  useLayoutEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step, isSaved]);

  function updateField<K extends keyof ProfileValues>(
    field: K,
    value: ProfileValues[K],
  ) {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setMessage("");
  }

  function getMergedSkills(): string[] | null {
    const additions = skillDraft
      .split(",")
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean);

    const skills = Array.from(new Set([...values.skills, ...additions]));

    if (skills.length > 30) {
      setErrors((previous) => ({
        ...previous,
        skills: "You can add up to 30 skills.",
      }));
      return null;
    }

    if (skills.some((skill) => skill.length > 60)) {
      setErrors((previous) => ({
        ...previous,
        skills: "Keep each skill within 60 characters.",
      }));
      return null;
    }

    return skills;
  }

  function addSkills() {
    const skills = getMergedSkills();

    if (!skills) return;

    updateField("skills", skills);
    setSkillDraft("");
    skillInputRef.current?.focus();
  }

  function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (
      !event.nativeEvent.isComposing &&
      (event.key === "Enter" || event.key === ",")
    ) {
      event.preventDefault();
      addSkills();
    }
  }

  function goBack() {
    if (savingLock.current) return;

    setErrors({});
    setMessage("");
    setStep((previous) => Math.max(0, previous - 1));
  }

  function goToDashboard() {
    savedRef.current = false;

    setIsSaved(false);
    setStep(0);
    setErrors({});
    setMessage("");

    router.replace("/dashboard");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingLock.current || isSaved) return;

    let candidate = values;

    if (step === 1) {
      const skills = getMergedSkills();

      if (!skills) return;

      candidate = { ...values, skills };

      setValues(candidate);
      setSkillDraft("");
    }

    const stepErrors = validateStep(step, candidate);

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setMessage("Please check the highlighted fields.");
      return;
    }

    if (step < steps.length - 1) {
      setErrors({});
      setMessage("");
      setStep((previous) => Math.min(steps.length - 1, previous + 1));
      return;
    }

    for (let index = 0; index < steps.length; index++) {
      const validationErrors = validateStep(index, candidate);

      if (Object.keys(validationErrors).length > 0) {
        setStep(index);
        setErrors(validationErrors);
        setMessage("Please check the highlighted fields.");
        return;
      }
    }

    savingLock.current = true;
    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.set("full_name", candidate.full_name.trim());
      formData.set("location", candidate.location.trim());
      formData.set("target_role", candidate.target_role.trim());
      formData.set("skills", candidate.skills.join(", "));
      formData.set("experience_level", candidate.experience_level);
      formData.set("work_arrangement", candidate.work_arrangement);
      formData.set("employment_type", candidate.employment_type);

      const result = await saveProfile(formData);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      savedRef.current = true;
      setIsSaved(true);
    } catch {
      setMessage("Your profile could not be saved. Please try again.");
    } finally {
      savingLock.current = false;
      setIsSaving(false);
    }
  }

  const initials = values.full_name.trim()
    ? values.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "JP";

  const previewPreferences = [
    workOptions.find((option) => option.value === values.work_arrangement)
      ?.label,
    employmentOptions.find((option) => option.value === values.employment_type)
      ?.label,
  ].filter(Boolean);

  if (isSaved) {
    return (
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className="py-12 text-center text-[#242332]"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d8f275] text-2xl"
        >
          ✓
        </div>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-3xl font-semibold tracking-tight outline-none"
        >
          Your profile is ready.
        </h2>

        <p role="status" className="mt-3 text-sm text-stone-500">
          Your career details have been saved.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              savedRef.current = false;
              setIsSaved(false);
              setStep(0);
              setErrors({});
              setMessage("");
            }}
            className="min-h-12 rounded-full border border-stone-200 px-6 py-3 text-sm font-medium hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
          >
            Edit again
          </button>

          <button
            type="button"
            onClick={goToDashboard}
            className={primaryButtonStyles}
          >
            Go to my dashboard →
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="text-[#242332]">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Your career, your way
          </p>

          <p className="shrink-0 text-xs text-stone-500">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        <div
          role="progressbar"
          aria-label="Profile steps"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${steps.length}: ${steps[step].title}`}
          className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100"
        >
          <motion.div
            initial={false}
            animate={{
              width: `${((step + 1) / steps.length) * 100}%`,
            }}
            transition={{ duration }}
            className="h-full rounded-full bg-[#b69ae9]"
          />
        </div>

        <ol className="mt-4 grid grid-cols-3 gap-2">
          {steps.map((item, index) => (
            <li
              key={item.title}
              aria-current={index === step ? "step" : undefined}
              className={`text-xs ${
                index === step
                  ? "font-semibold text-[#242332]"
                  : "text-stone-500"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  index < step
                    ? "bg-[#d8f275] text-[#242332]"
                    : index === step
                      ? "bg-[#242332] text-white"
                      : "bg-stone-100"
                }`}
              >
                {index < step ? "✓" : index + 1}
              </span>

              {item.title}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid items-start gap-8 min-[1100px]:grid-cols-[minmax(0,1fr)_240px]">
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={isSaving}
          className="min-w-0"
        >
          <fieldset disabled={isSaving} className="min-w-0">
            {/*
              Animate only the current step on entry.
              No exit wait or animation-dependent form lock.
            */}
            <motion.section
              key={step}
              initial={reducedMotion ? false : { x: 10 }}
              animate={{ x: 0 }}
              transition={{ duration }}
              className="min-w-0"
            >
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight outline-none"
              >
                {steps[step].title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                {steps[step].description}
              </p>

              <div className="mt-7 space-y-6">
                {step === 0 && (
                  <>
                    <TextField
                      name="full_name"
                      label="Full name"
                      value={values.full_name}
                      placeholder="What should we call you?"
                      maxLength={100}
                      autoComplete="name"
                      error={errors.full_name}
                      onChange={(value) => updateField("full_name", value)}
                    />

                    <TextField
                      name="location"
                      label="Where are you based?"
                      value={values.location}
                      placeholder="Lagos, Nigeria"
                      maxLength={150}
                      error={errors.location}
                      onChange={(value) => updateField("location", value)}
                    />

                    <div className="rounded-xl bg-[#f0ebff] p-4">
                      <p className="text-sm font-medium">
                        A profile that grows with you.
                      </p>

                      <p className="mt-1 text-xs leading-6 text-stone-600">
                        Update your details whenever your goals change.
                      </p>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <TextField
                      name="target_role"
                      label="What role are you looking for?"
                      value={values.target_role}
                      placeholder="Frontend Developer"
                      maxLength={150}
                      error={errors.target_role}
                      onChange={(value) => updateField("target_role", value)}
                    />

                    <div>
                      <label
                        htmlFor="skill-input"
                        className="text-sm font-semibold"
                      >
                        Your skills
                      </label>

                      <div className="mt-2 flex gap-2">
                        <input
                          ref={skillInputRef}
                          id="skill-input"
                          value={skillDraft}
                          onChange={(event) => {
                            setSkillDraft(event.target.value);
                            setErrors((previous) => ({
                              ...previous,
                              skills: undefined,
                            }));
                            setMessage("");
                          }}
                          onKeyDown={handleSkillKeyDown}
                          placeholder="Add a skill"
                          maxLength={2000}
                          aria-invalid={!!errors.skills}
                          aria-describedby={
                            errors.skills
                              ? "skills-help skills-error"
                              : "skills-help"
                          }
                          className={`${inputStyles} mt-0 min-w-0`}
                        />

                        <button
                          type="button"
                          onClick={addSkills}
                          disabled={!skillDraft.trim()}
                          className="shrink-0 rounded-xl bg-[#242332] px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>

                      <p
                        id="skills-help"
                        className="mt-2 text-xs leading-5 text-stone-500"
                      >
                        Press Enter or use commas. Up to 30 skills.
                      </p>

                      <ul className="mt-4 flex flex-wrap gap-2">
                        <AnimatePresence initial={false}>
                          {values.skills.map((skill) => (
                            <motion.li
                              key={skill}
                              initial={
                                reducedMotion
                                  ? false
                                  : { opacity: 0, scale: 0.95 }
                              }
                              animate={{ opacity: 1, scale: 1 }}
                              exit={
                                reducedMotion
                                  ? undefined
                                  : { opacity: 0, scale: 0.95 }
                              }
                              transition={{ duration }}
                              className="flex max-w-full items-center gap-1 rounded-xl bg-[#edf5ce] py-1 pl-3 pr-1 text-sm"
                            >
                              <span className="break-words">{skill}</span>

                              <button
                                type="button"
                                aria-label={`Remove ${skill}`}
                                onClick={() =>
                                  updateField(
                                    "skills",
                                    values.skills.filter(
                                      (item) => item !== skill,
                                    ),
                                  )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-violet-600"
                              >
                                <span aria-hidden="true">×</span>
                              </button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>

                      {errors.skills && (
                        <p
                          id="skills-error"
                          className="mt-2 text-xs text-red-700"
                        >
                          {errors.skills}
                        </p>
                      )}
                    </div>

                    <ChoiceGroup
                      name="experience_level"
                      label="Experience level"
                      value={values.experience_level}
                      options={experienceOptions}
                      error={errors.experience_level}
                      onChange={(value) =>
                        updateField("experience_level", value)
                      }
                    />
                  </>
                )}

                {step === 2 && (
                  <>
                    <ChoiceGroup
                      name="work_arrangement"
                      label="Where would you like to work?"
                      value={values.work_arrangement}
                      options={workOptions}
                      error={errors.work_arrangement}
                      onChange={(value) =>
                        updateField("work_arrangement", value)
                      }
                    />

                    <ChoiceGroup
                      name="employment_type"
                      label="Preferred employment type"
                      value={values.employment_type}
                      options={employmentOptions}
                      error={errors.employment_type}
                      onChange={(value) =>
                        updateField("employment_type", value)
                      }
                    />

                    <p className="rounded-xl bg-[#f0ebff] p-4 text-xs leading-6 text-stone-600">
                      These preferences will guide future job recommendations.
                      You can change them later.
                    </p>
                  </>
                )}
              </div>
            </motion.section>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-stone-100 pt-6">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="min-h-12 rounded-full px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-violet-600 disabled:invisible"
              >
                ← Back
              </button>

              <motion.button
                type="submit"
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                className={primaryButtonStyles}
              >
                {isSaving ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin"
                    />
                    Saving profile…
                  </>
                ) : step === 2 ? (
                  "Save my profile →"
                ) : (
                  "Continue →"
                )}
              </motion.button>
            </div>
          </fieldset>

          <p
            role="status"
            aria-live="polite"
            className="mt-4 min-h-5 text-sm text-red-700"
          >
            {message}
          </p>

          <p className="mt-2 text-xs leading-5 text-stone-500">
            Changes are saved when you select “Save my profile”.
          </p>
        </form>

        <aside className="sticky top-8 hidden overflow-hidden rounded-2xl bg-[#242332] p-5 text-white min-[1100px]:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8f275]">
            Your profile preview
          </p>

          <div
            aria-hidden="true"
            className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d8f275] text-lg font-semibold text-[#242332]"
          >
            {initials}
          </div>

          <h3 className="mt-4 break-words text-lg font-semibold">
            {values.full_name.trim() || "Your name"}
          </h3>

          <p className="mt-2 break-words text-sm text-white/80">
            {values.target_role.trim() || "Your next role"}
          </p>

          <p className="mt-2 break-words text-xs text-white/60">
            {values.location.trim() || "Your location"}
          </p>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs text-white/60">Your strengths</p>

            <ul className="mt-3 flex flex-wrap gap-2">
              {values.skills.slice(0, 6).map((skill) => (
                <li
                  key={skill}
                  className="max-w-full break-words rounded-lg bg-white/10 px-2 py-1 text-xs"
                >
                  {skill}
                </li>
              ))}
            </ul>

            {values.skills.length === 0 && (
              <p className="mt-2 text-xs leading-5 text-white/50">
                Your skills will appear here.
              </p>
            )}

            {values.skills.length > 6 && (
              <p className="mt-2 text-xs text-white/60">
                +{values.skills.length - 6} more
              </p>
            )}
          </div>

          {previewPreferences.length > 0 && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-xs leading-6 text-[#d8f275]">
                {previewPreferences.join(" · ")}
              </p>
            </div>
          )}

          <p className="mt-7 text-xs leading-6 text-white/50">
            A little clarity today.
            <br />A better opportunity tomorrow.
          </p>
        </aside>
      </div>
    </div>
  );
}
