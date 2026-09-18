"use client";

import { useEffect, useMemo, useState } from "react";
import { createUserClient } from "@/lib/supabase/userClient";
import { listTasks, listAchievements, type CloudTask, type CloudAchievement } from "@/lib/tasks/cloudStore";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_S = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function toKey(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function getWeekStart(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

function getWeekNum(d: Date) {
  const s = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - s.getTime()) / 86400000 + s.getDay() + 1) / 7);
}

function fmtTime(time: string) {
  if (!time) return "";
  const [hh, mm] = time.split(":");
  const n = Number(hh);
  const h12 = n % 12 || 12;
  return `${h12}:${mm}${n < 12 ? " AM" : " PM"}`;
}

export default function HomeTab({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<CloudTask[]>([]);
  const [achievements, setAchievements] = useState<CloudAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const supabase = createUserClient();
        const [cloudTasks, cloudAchievements] = await Promise.all([
          listTasks(supabase, userId),
          listAchievements(supabase, userId),
        ]);
        if (!cancelled) {
          setTasks(cloudTasks);
          setAchievements(cloudAchievements);
        }
      } catch {
        if (!cancelled) setLoadError("تعذّر تحميل ملخّص الرئيسية من الخادم. تحقق من اتصالك وأعد تحميل الصفحة.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const now = useMemo(() => new Date(), []);
  const todayKey = toKey(now);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearKey = String(now.getFullYear());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CloudTask[]>();
    for (const t of tasks) {
      if (!t.date || t.archived) continue;
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.from || "").localeCompare(b.from || ""));
    }
    return map;
  }, [tasks]);

  const todayTasks = tasksByDate.get(todayKey) ?? [];
  const todayDoneCount = todayTasks.filter((t) => t.done).length;

  const monthAchCount = achievements.filter((a) => a.date.startsWith(monthKey)).length;
  const yearAchCount = achievements.filter((a) => a.date.startsWith(yearKey)).length;

  const weekCols = useMemo(() => {
    const ws = getWeekStart(now);
    const cols: { key: string; date: Date; isToday: boolean; items: CloudTask[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      const k = toKey(d);
      cols.push({ key: k, date: d, isToday: k === todayKey, items: tasksByDate.get(k) ?? [] });
    }
    return cols;
  }, [now, tasksByDate, todayKey]);

  if (loadError) {
    return <div className="goals-empty">{loadError}</div>;
  }

  if (loading) {
    return <div className="goals-empty">جارٍ تحميل الرئيسية...</div>;
  }

  return (
    <div>
      <div className="home-stats">
        <div className="sc accent">
          <div className="sc-label">مهام اليوم</div>
          <div className="sc-num">{todayDoneCount}/{todayTasks.length}</div>
          <div className="sc-sub">{DAYS[now.getDay()]}</div>
        </div>
        <div className="sc">
          <div className="sc-label">إنجازات الشهر</div>
          <div className="sc-num">{monthAchCount}</div>
          <div className="sc-sub" style={{ fontWeight: 500 }}>{MONTHS[now.getMonth()]}</div>
        </div>
        <div className="sc">
          <div className="sc-label">إنجازات السنة</div>
          <div className="sc-num">{yearAchCount}</div>
          <div className="sc-sub" style={{ fontWeight: 500, direction: "ltr", textAlign: "right" }}>{now.getFullYear()}</div>
        </div>
      </div>

      <div className="home-mid">
        <div className="date-card">
          <span className="dc-day">{DAYS[now.getDay()]}</span>
          <span className="dc-num">{now.getDate()}</span>
          <span className="dc-month">{MONTHS[now.getMonth()]}</span>
        </div>
        <div className="tasks-box">
          <div className="box-header">
            <span className="box-title">مهام اليوم</span>
            <span className="cbadge">{todayTasks.length} مهام</span>
          </div>
          <div>
            {todayTasks.length ? (
              todayTasks.map((t) => (
                <div className="trow" key={t.id}>
                  <div className={`chk${t.done ? " on" : ""}`} />
                  <span className="trow-txt">{t.name}</span>
                  <span className="trow-time" dir="ltr">{t.from ? fmtTime(t.from) : ""}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: "12px 0", textAlign: "center", fontSize: "0.72rem", color: "#a0a09a" }}>لا توجد مهام لليوم</div>
            )}
          </div>
        </div>
      </div>

      <div className="sec-title">الأسبوع الحالي — الأسبوع {getWeekNum(now)}</div>
      <div className="week-strip">
        <div className="ws-head">
          {weekCols.map((col) => (
            <div key={col.key} className={`wd${col.isToday ? " td" : ""}`}>
              <span>{DAYS_S[col.date.getDay()]}</span>
              <span className="wd-n">{col.date.getDate()}</span>
            </div>
          ))}
        </div>
        <div className="ws-body">
          {weekCols.map((col) => (
            <div key={col.key} className={`wc${col.isToday ? " td" : ""}`}>
              {col.items.slice(0, 3).map((t) => (
                <span key={t.id} className={`wdot${t.done ? " done" : ""}`}>{t.done ? "✓ " : ""}{t.name}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
