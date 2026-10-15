"use client";

import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

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

const experienceOptions = [
  { value: "graduate", label: "Graduate", detail: "Starting my career" },
  { value: "junior", label: "Junior", detail: "Building experience" },
  { value: "mid", label: "Mid-level", detail: "Confident in my craft" },
  { value: "senior", label: "Senior", detail: "Bringing deep experience" },
];

const workOptions = [
  { value: "remote", label: "Remote", detail: "Work from anywhere eligible" },
  { value: "hybrid", label: "Hybrid", detail: "A mix of home and office" },
  { value: "onsite", label: "On-site", detail: "Work with the team in person" },
  { value: "any", label: "Open to any", detail: "Keep my options open" },
];

const employmentOptions = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "any", label: "Open to any" },
];

const inputStyles =
  "mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#242332] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60";

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
  options: {
    value: string;
    label: string;
    detail?: string;
  }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className="text-sm font-semibold">{label}</legend>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />

            <span className="flex h-full items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 transition duration-200 peer-checked:border-[#9680d8] peer-checked:bg-[#f0ebff] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-violet-600">
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
        <p
          id={`${name}-error`}
          className="mt-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
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
  const transitionLock = useRef(false);
  const savingLock = useRef(false);

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
  const [direction, setDirection] = useState(1);
  const [skillDraft, setSkillDraft] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const duration = reducedMotion ? 0 : 0.2;

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

  function mergeSkills() {
    const additions = skillDraft
      .split(",")
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean);

    const skills = Array.from(
      new Set([...values.skills, ...additions]),
    );

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
    const skills = mergeSkills();

    if (!skills) return;

    updateField("skills", skills);
    setSkillDraft("");
    skillInputRef.current?.focus();
  }

  function handleSkillKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      !event.nativeEvent.isComposing &&
      (event.key === "Enter" || event.key === ",")
    ) {
      event.preventDefault();
      addSkills();
    }
  }

  function validateStep(
    currentStep: number,
    candidate: ProfileValues,
  ): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (currentStep === 0) {
      if (
        !candidate.full_name.trim() ||
        candidate.full_name.trim().length > 100
      ) {
        nextErrors.full_name =
          "Enter your name, up to 100 characters.";
      }

      if (
        !candidate.location.trim() ||
        candidate.location.trim().length > 150
      ) {
        nextErrors.location =
          "Enter your city and country, up to 150 characters.";
      }
    }

    if (currentStep === 1) {
      if (
        !candidate.target_role.trim() ||
        candidate.target_role.trim().length > 150
      ) {
        nextErrors.target_role =
          "Enter a target role, up to 150 characters.";
      }

      if (
        candidate.skills.length < 1 ||
        candidate.skills.length > 30 ||
        candidate.skills.some((skill) => skill.length > 60)
      ) {
        nextErrors.skills =
          "Add 1–30 skills, each up to 60 characters.";
      }

      if (
        !experienceOptions.some(
          (option) =>
            option.value === candidate.experience_level,
        )
      ) {
        nextErrors.experience_level =
          "Choose your experience level.";
      }
    }

    if (currentStep === 2) {
      if (
        !workOptions.some(
          (option) =>
            option.value === candidate.work_arrangement,
        )
      ) {
        nextErrors.work_arrangement =
          "Choose a work arrangement.";
      }

      if (
        !employmentOptions.some(
          (option) =>
            option.value === candidate.employment_type,
        )
      ) {
        nextErrors.employment_type =
          "Choose an employment type.";
      }
    }

    return nextErrors;
  }

  function goToStep(nextStep: number) {
    if (transitionLock.current || nextStep === step) return;

    transitionLock.current = true;
    setIsTransitioning(true);
    setDirection(nextStep > step ? 1 : -1);
    setErrors({});
    setMessage("");
    setStep(nextStep);
  }

  function finishTransition() {
    transitionLock.current = false;
    setIsTransitioning(false);
    headingRef.current?.focus();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      savingLock.current ||
      transitionLock.current ||
      isSaved
    ) {
      return;
    }

    let candidate = values;

    if (step === 1) {
      const skills = mergeSkills();

      if (!skills) return;

      candidate = { ...values, skills };
      setValues(candidate);
      setSkillDraft("");
    }

    const nextErrors = validateStep(step, candidate);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage("Please check the highlighted fields.");
      return;
    }

    if (step < steps.length - 1) {
      goToStep(step + 1);
      return;
    }

    // Recheck every step before saving.
    for (let index = 0; index < steps.length; index++) {
      const stepErrors = validateStep(index, candidate);

      if (Object.keys(stepErrors).length > 0) {
        goToStep(index);
        setErrors(stepErrors);
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
      formData.set(
        "experience_level",
        candidate.experience_level,
      );
      formData.set(
        "work_arrangement",
        candidate.work_arrangement,
      );
      formData.set(
        "employment_type",
        candidate.employment_type,
      );

      const result = await saveProfile(formData);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setIsSaved(true);
    } catch {
      setMessage(
        "Your profile could not be saved. Please try again.",
      );
    } finally {
      savingLock.current = false;
      setIsSaving(false);
    }
  }

  const previewPreferences = [
    workOptions.find(
      (option) => option.value === values.work_arrangement,
    )?.label,
    employmentOptions.find(
      (option) => option.value === values.employment_type,
    )?.label,
  ].filter(Boolean);

  if (isSaved) {
    return (
      <motion.div
        initial={
          reducedMotion ? false : { opacity: 0, y: 10 }
        }
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration }}
        className="py-12 text-center text-[#242332]"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d8f275] text-2xl"
        >
          ✓
        </div>

        <h2
          tabIndex={-1}
          ref={(node) => node?.focus()}
          className="mt-6 text-3xl font-semibold tracking-tight outline-none"
        >
          Your next chapter starts here.
        </h2>

        <p role="status" className="mt-3 text-sm text-stone-500">
          Your career profile has been saved.
        </p>

        <button
          type="button"
          onClick={() => {
            router.replace("/dashboard");
            router.refresh();
          }}
          className="mt-7 rounded-full bg-[#242332] px-6 py-3 text-sm font-semibold text-white hover:bg-[#39364e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
        >
          Go to my dashboard →
        </button>
      </motion.div>
    );
  }

  return (
    <div className="text-[#242332]">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Your career, your way
          </p>

          <p className="text-xs text-stone-500">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        <div
          role="progressbar"
          aria-label="Onboarding steps"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of 3: ${steps[step].title}`}
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
          <fieldset
            disabled={isSaving || isTransitioning}
            className="min-w-0"
          >
            <motion.div
              layout={reducedMotion ? false : "size"}
              transition={{ duration }}
              className="overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.section
                  key={step}
                  initial={{
                    opacity: reducedMotion ? 1 : 0,
                    x: reducedMotion ? 0 : direction * 14,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: reducedMotion ? 1 : 0,
                    x: reducedMotion ? 0 : direction * -14,
                  }}
                  transition={{ duration }}
                  onAnimationComplete={finishTransition}
                  className="pb-2"
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
                        <div>
                          <label
                            htmlFor="full_name"
                            className="text-sm font-semibold"
                          >
                            Full name
                          </label>

                          <input
                            id="full_name"
                            name="full_name"
                            autoComplete="name"
                            value={values.full_name}
                            onChange={(event) =>
                              updateField(
                                "full_name",
                                event.target.value,
                              )
                            }
                            placeholder="What should we call you?"
                            maxLength={100}
                            required
                            aria-invalid={!!errors.full_name}
                            aria-describedby={
                              errors.full_name
                                ? "full-name-error"
                                : undefined
                            }
                            className={inputStyles}
                          />

                          {errors.full_name && (
                            <p
                              id="full-name-error"
                              className="mt-2 text-xs text-red-700"
                            >
                              {errors.full_name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="location"
                            className="text-sm font-semibold"
                          >
                            Where are you based?
                          </label>

                          <input
                            id="location"
                            name="location"
                            value={values.location}
                            onChange={(event) =>
                              updateField(
                                "location",
                                event.target.value,
                              )
                            }
                            placeholder="Lagos, Nigeria"
                            maxLength={150}
                            required
                            aria-invalid={!!errors.location}
                            aria-describedby={
                              errors.location
                                ? "location-error"
                                : undefined
                            }
                            className={inputStyles}
                          />

                          {errors.location && (
                            <p
                              id="location-error"
                              className="mt-2 text-xs text-red-700"
                            >
                              {errors.location}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-[#f0ebff] p-4">
                          <p className="text-sm font-medium">
                            A profile that grows with you.
                          </p>
                          <p className="mt-1 text-xs leading-6 text-stone-600">
                            You can update your details whenever
                            your goals change.
                          </p>
                        </div>
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <div>
                          <label
                            htmlFor="target_role"
                            className="text-sm font-semibold"
                          >
                            What role are you looking for?
                          </label>

                          <input
                            id="target_role"
                            name="target_role"
                            value={values.target_role}
                            onChange={(event) =>
                              updateField(
                                "target_role",
                                event.target.value,
                              )
                            }
                            placeholder="Frontend Developer"
                            maxLength={150}
                            required
                            aria-invalid={!!errors.target_role}
                            aria-describedby={
                              errors.target_role
                                ? "target-role-error"
                                : undefined
                            }
                            className={inputStyles}
                          />

                          {errors.target_role && (
                            <p
                              id="target-role-error"
                              className="mt-2 text-xs text-red-700"
                            >
                              {errors.target_role}
                            </p>
                          )}
                        </div>

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
                              }}
                              onKeyDown={handleSkillKeyDown}
                              placeholder="Add a skill"
                              maxLength={2000}
                              aria-invalid={!!errors.skills}
                              aria-describedby={`skills-help${
                                errors.skills
                                  ? " skills-error"
                                  : ""
                              }`}
                              className={`${inputStyles} mt-0 min-w-0`}
                            />

                            <button
                              type="button"
                              onClick={addSkills}
                              disabled={!skillDraft.trim()}
                              className="shrink-0 rounded-xl bg-[#242332] px-4 text-sm font-medium text-white disabled:opacity-40"
                            >
                              Add
                            </button>
                          </div>

                          <p
                            id="skills-help"
                            className="mt-2 text-xs leading-5 text-stone-500"
                          >
                            Press Enter or use commas. Up to 30
                            skills.
                          </p>

                          <ul className="mt-4 flex flex-wrap gap-2">
                            {values.skills.map((skill) => (
                              <motion.li
                                key={skill}
                                layout={!reducedMotion}
                                initial={
                                  reducedMotion
                                    ? false
                                    : { opacity: 0, scale: 0.95 }
                                }
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration }}
                                className="flex max-w-full items-center gap-1 rounded-xl bg-[#edf5ce] py-1 pl-3 pr-1 text-sm"
                              >
                                <span className="break-words">
                                  {skill}
                                </span>

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
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-violet-600"
                                >
                                  <span aria-hidden="true">×</span>
                                </button>
                              </motion.li>
                            ))}
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
                          These preferences will guide future job
                          recommendations. You can change them later.
                        </p>
                      </>
                    )}
                  </div>
                </motion.section>
              </AnimatePresence>
            </motion.div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-stone-100 pt-6">
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                disabled={step === 0}
                className="rounded-full px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:invisible"
              >
                ← Back
              </button>

              <motion.button
                type="submit"
                whileTap={
                  reducedMotion ? undefined : { scale: 0.98 }
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#242332] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#39364e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 disabled:opacity-60"
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

          <p className="mt-2 text-xs text-stone-500">
            Changes are saved when you select “Save my profile”.
          </p>
        </form>

        {/* Desktop preview */}
        <aside className="sticky top-8 hidden overflow-hidden rounded-2xl bg-[#242332] p-5 text-white min-[1100px]:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8f275]">
            Your profile preview
          </p>

          <div
            aria-hidden="true"
            className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d8f275] text-lg font-semibold text-[#242332]"
          >
            {values.full_name.trim()
              ? values.full_name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()
              : "JP"}
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
            <p className="text-xs text-white/60">
              Your strengths
            </p>

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
            <br />
            A better opportunity tomorrow.
          </p>
        </aside>
      </div>
    </div>
  );
}