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
      </div>
    </main>
  );
}
