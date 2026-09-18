"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import TasksTab from "./TasksTab";
import GoalsTab from "./GoalsTab";
import AchievementsTab from "./AchievementsTab";
import CalendarTab from "./CalendarTab";
import HomeTab from "./HomeTab";

type PageId = "home" | "tasks" | "achieve" | "goals" | "cal";

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: "home", label: "الرئيسية" },
  { id: "tasks", label: "المهام" },
  { id: "achieve", label: "الإنجازات" },
  { id: "goals", label: "الأهداف" },
  { id: "cal", label: "التقويم" },
];

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
        ) : activePage === "goals" ? (
          <GoalsTab userId={user.id} />
        ) : activePage === "achieve" ? (
          <AchievementsTab userId={user.id} />
        ) : activePage === "cal" ? (
          <CalendarTab userId={user.id} />
        ) : (
          <HomeTab userId={user.id} />
        )}
      </div>
    </div>
  );
}
