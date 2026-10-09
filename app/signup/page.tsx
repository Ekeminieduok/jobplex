import type { Metadata } from "next";
import SignupForm from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your account | Job Plex",
  description: "Discover jobs that match your skills and goals.",
};

export default function SignupPage() {
  return <SignupForm />;
}