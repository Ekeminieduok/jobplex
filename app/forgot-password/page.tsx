import AuthCard from "@/components/auth/auth-card";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your account email to get you a link to choose a new password."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}