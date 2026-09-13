"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import TasksTab from "./TasksTab";

type PageId = "home" | "tasks" | "achieve" | "goals" | "cal";

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: "home", label: "الرئيسية" },
  { id: "tasks", label: "المهام" },
  { id: "achieve", label: "الإنجازات" },
  { id: "goals", label: "الأهداف" },
  { id: "cal", label: "التقويم" },
];

const PLACEHOLDER_COPY: Record<Exclude<PageId, "tasks">, { title: string; body: string }> = {
  home: {
    title: "الرئيسية",
    body: "لوحة النظرة العامة (الإحصائيات، التقدّم الشهري والسنوي) قادمة في دفعة لاحقة.",
  },
  achieve: {
    title: "الإنجازات",
    body: "سجل الإنجازات الكامل قادم في دفعة لاحقة.",
  },
  goals: {
    title: "الأهداف",
    body: "تبويب الأهداف الكامل قادم في دفعة لاحقة.",
  },
  cal: {
    title: "التقويم",
    body: "التقويم الأسبوعي والشهري قادم في دفعة لاحقة.",
  },
};

export default function PlatformShell({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => void;
}) {
  const [activePage, setActivePage] = useState<PageId>("home");

  return (
    <div className="pf-app" dir="rtl">
      <div className="pf-topbar">
        <button type="button" className="pf-nav-logo" onClick={() => setActivePage("home")} aria-label="الرئيسية">
          <img src="/hourglass-logo.png" alt="شعار رحلة مُنجِز" />
        </button>

        <div className="pf-nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nb${activePage === item.id ? " active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="pf-nav-right">
          <Link className="mini-link" href="/tasks">لوحتي المختصرة ↗</Link>
          <span className="text-sm text-muted-foreground" dir="ltr" style={{ fontSize: "0.72rem" }}>{user.email}</span>
          <button type="button" className="pf-signout" onClick={onSignOut}>تسجيل الخروج</button>
        </div>
      </div>

      <div className="pf-wrap">
        {activePage === "tasks" ? (
          <TasksTab userId={user.id} />
        ) : (
          <div className="pf-page-placeholder">
            <h2>{PLACEHOLDER_COPY[activePage].title}</h2>
            <p>{PLACEHOLDER_COPY[activePage].body}</p>
          </div>
        )}
      </div>
    </div>
  );
}
