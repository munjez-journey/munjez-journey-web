"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { sections } from "../_lib/sections";

const navItems = [
  ...Object.values(sections).map((section) => ({
    label: section.label,
    href: section.basePath,
  })),
  { label: "نصوص الصفحات الثابتة", href: "/admin/home" },
  { label: "الإعدادات العامة", href: "/admin/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [attemptId, setAttemptId] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // إغلاق القائمة على الجوال عند الانتقال لصفحة أخرى
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // محاولتان بالضبط. "ok/no" ردّ صريح؛ "unknown" فشل اتصال/غير واضح.
    async function verifyOnce(): Promise<"admin" | "not-admin" | "no-session" | "unknown"> {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!data.user) {
          const explicit =
            !error || error.name === "AuthSessionMissingError" || error.status === 401 || error.status === 403;
          return explicit ? "no-session" : "unknown";
        }
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profileError) return "unknown";
        if (profile?.role !== "admin") return "not-admin";
        setUser(data.user);
        return "admin";
      } catch {
        return "unknown";
      }
    }

    async function verify() {
      setVerifyFailed(false);
      setChecking(true);
      let result = await verifyOnce();
      if (result === "unknown") result = await verifyOnce();
      if (cancelled) return;

      if (result === "admin") {
        setChecking(false);
      } else if (result === "no-session") {
        router.replace("/admin/login");
      } else if (result === "not-admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=unauthorized");
      } else {
        // فشل غير واضح مرتين: لا نسجّل الخروج، نعرض رسالة مع إعادة المحاولة
        setVerifyFailed(true);
        setChecking(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [router, attemptId]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (verifyFailed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-foreground">تعذر التحقق من الصلاحية، أعد المحاولة.</p>
        <button
          onClick={() => setAttemptId((n) => n + 1)}
          className="bg-primary px-5 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          إعادة المحاولة
        </button>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">جارٍ التحقق من الدخول...</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* الجوال: شريط علوي بزر ☰ */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link href="/admin" className="text-base font-semibold text-foreground">
          رحلة مُنجِز
        </Link>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          className="border border-border px-3 py-1.5 text-lg leading-none text-foreground"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-64 shrink-0 flex-col overflow-y-auto border-e border-border bg-card transition-transform md:static md:z-auto md:translate-x-0 md:transition-none ${
          menuOpen ? "translate-x-0" : "max-md:translate-x-full"
        }`}
      >
        <Link
          href="/admin"
          className="border-b border-border px-6 py-6 text-lg font-semibold text-foreground"
        >
          رحلة مُنجِز
        </Link>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "bg-foreground px-4 py-2.5 text-sm font-medium text-background! hover:text-background!"
                    : "px-4 py-2.5 text-sm text-foreground transition-opacity hover:opacity-70"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="mb-3 truncate text-xs text-muted-foreground" dir="ltr">
            {user?.email}
          </p>
          <button
            onClick={handleSignOut}
            className="w-full border border-border px-4 py-2 text-sm text-foreground transition-opacity hover:opacity-70"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-10 pt-20 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
