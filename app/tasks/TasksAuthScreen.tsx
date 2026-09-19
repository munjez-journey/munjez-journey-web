"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/userClient";

type Mode = "login" | "signup";

export default function TasksAuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (user: User) => void;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const supabase = createUserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error || !data.user) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }

    onAuthenticated(data.user);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const supabase = createUserClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data.user) {
      setLoading(false);
      setError("تعذّر إنشاء الحساب. تأكد من صحة البريد وأن كلمة المرور 6 أحرف على الأقل.");
      return;
    }

    // إنشاء صف الملف الشخصي — قد يفشل بصمت إن كان الحساب بانتظار تأكيد
    // البريد الإلكتروني (لا توجد جلسة فعّالة بعد)، وفي هذه الحالة يُفضَّل
    // الاعتماد على Trigger داخل قاعدة البيانات لإنشاء الصف تلقائياً.
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, role: "user" });

    if (profileError) {
      console.warn("تعذّر إنشاء صف profiles من المتصفح:", profileError.message);
    }

    setLoading(false);

    if (data.session) {
      onAuthenticated(data.user);
      return;
    }

    setNotice("تم إنشاء الحساب بنجاح. إن طُلب تأكيد عبر البريد الإلكتروني، افتح الرسالة ثم سجّل الدخول.");
    setMode("login");
  }

  async function handleGoogleLogin() {
    setError("");
    setNotice("");
    setGoogleLoading(true);

    const supabase = createUserClient();
    const next = window.location.pathname;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setGoogleLoading(false);
      setError("تعذّر بدء تسجيل الدخول بواسطة Google. حاول مرة أخرى.");
    }
    // عند النجاح تنتقل الصفحة إلى Google، فلا حاجة لإيقاف googleLoading هنا.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm border border-border p-8">
        <h1 className="mb-2 text-center text-2xl font-semibold text-foreground">
          مساحة المهام
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          سجّل الدخول أو أنشئ حساباً لمتابعة مهامك وإنجازاتك
        </p>

        <div className="mb-6 flex border border-border">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={
              mode === "login"
                ? "flex-1 bg-primary py-2 text-sm text-primary-foreground!"
                : "flex-1 py-2 text-sm text-foreground"
            }
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={
              mode === "signup"
                ? "flex-1 bg-primary py-2 text-sm text-primary-foreground!"
                : "flex-1 py-2 text-sm text-foreground"
            }
          >
            إنشاء حساب
          </button>
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-foreground">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-foreground">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-sm text-foreground" role="status">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-primary py-2.5 text-primary-foreground! transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "جارٍ التنفيذ..."
              : mode === "login"
                ? "تسجيل الدخول"
                : "إنشاء حساب"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">أو</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-2 border border-border bg-background py-2.5 text-sm text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
          </svg>
          {googleLoading ? "جارٍ التحويل إلى Google..." : "الدخول بواسطة Google"}
        </button>
      </div>
    </main>
  );
}
