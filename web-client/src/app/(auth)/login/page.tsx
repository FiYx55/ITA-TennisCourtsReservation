"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoginForm } from "@/modules/auth/components/login-form";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { useEffect } from "react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/courts");
  }, [user, router]);

  if (user) return null;

  return isRegister ? (
    <RegisterForm onSwitchToLogin={() => setIsRegister(false)} />
  ) : (
    <LoginForm onSwitchToRegister={() => setIsRegister(true)} />
  );
}
