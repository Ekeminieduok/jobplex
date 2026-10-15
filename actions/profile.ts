"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const targetRole = String(formData.get("target_role") ?? "").trim();

  const skills = Array.from(
    new Set(
      String(formData.get("skills") ?? "")
        .split(",")
        .map((skill) => skill.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const experienceLevel = String(formData.get("experience_level") ?? "");
  const workArrangement = String(formData.get("work_arrangement") ?? "");
  const employmentType = String(formData.get("employment_type") ?? "");

  if (
    !fullName ||
    fullName.length > 100 ||
    !location ||
    location.length > 150 ||
    !targetRole ||
    targetRole.length > 150
  ) {
    return {
      success: false,
      message: "Enter a valid name, location, and target role.",
    };
  }

  if (
    skills.length < 1 ||
    skills.length > 30 ||
    skills.some((skill) => skill.length > 60)
  ) {
    return {
      success: false,
      message: "Enter 1–30 skills, each no longer than 60 characters.",
    };
  }

  if (
    !["graduate", "junior", "mid", "senior"].includes(experienceLevel) ||
    !["remote", "hybrid", "onsite", "any"].includes(workArrangement) ||
    !["full_time", "part_time", "contract", "internship", "any"].includes(
      employmentType,
    )
  ) {
    return {
      success: false,
      message: "Choose valid experience and job preferences.",
    };
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  const userId = auth?.claims?.sub;

  if (authError || !userId) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      full_name: fullName,
      location,
      target_role: targetRole,
      skills,
      experience_level: experienceLevel,
      work_arrangement: workArrangement,
      employment_type: employmentType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return {
      success: false,
      message: "Your profile could not be saved. Please try again.",
    };
  }

  revalidatePath("/onboarding");
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Your career profile has been saved.",
  };
}
