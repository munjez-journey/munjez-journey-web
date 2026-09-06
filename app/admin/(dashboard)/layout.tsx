"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { sections } from "../_lib/sections";

const navItems = Object.values(sections).map((section) => ({
  label: section.label,
  href: section.basePath,
}));

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace("/admin/login");
        return;
      }
      setUser(data.user);
      setChecking(false);
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
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
      <aside className="flex w-64 shrink-0 flex-col border-e border-border bg-card">
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

      <main className="flex-1 px-10 py-10">{children}</main>
    </div>
  );
}
