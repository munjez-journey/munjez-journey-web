"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowLeft, ArrowUpLeft, CalendarDays, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MunjezFooter } from "@/components/site-chrome";
import { createUserClient } from "@/lib/supabase/userClient";
import { listTasks, type CloudTask, listGoals, type CloudGoal } from "@/lib/tasks/cloudStore";

type Task = CloudTask;

function dateKey(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateLabel(value: string) {
  if (!value) return "بدون تاريخ";
  return new Intl.DateTimeFormat("ar-SA", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));
}

function daysFromToday(value: string) {
  if (!value) return 999;
  return Math.round((new Date(`${value}T12:00:00`).getTime() - new Date(`${dateKey(0)}T12:00:00`).getTime()) / 86400000);
}

function timeLabel(time: string) {
  return time ? new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${time}:00`)) : "";
}

// نفس تصنيفات وألوان تبويب الأهداف في public/munjez-platform.html (للعرض فقط هنا)
const GOAL_CAT_CLASS: Record<string, string> = {
  "ترفيه": "gc-fun",
  "رياضة": "gc-sport",
  "تعليم": "gc-edu",
  "صحة": "gc-health",
  "عمل": "gc-work",
  "شخصي": "gc-per",
};

function statusFor(task: Task) {
  if (task.done) return { label: "مكتملة", tone: "done" };
  if (!task.date) return { label: "بدون تاريخ", tone: "upcoming" };
  const offset = daysFromToday(task.date);
  if (offset < 0) {
    const days = Math.abs(offset);
    return { label: days === 1 ? "متأخرة يوم" : days === 2 ? "متأخرة يومين" : `متأخرة ${days} أيام`, tone: "late" };
  }
  if (offset === 0) return { label: "اليوم", tone: "today" };
  return { label: offset === 1 ? "متبقي يوم" : offset === 2 ? "متبقي يومين" : `متبقي ${offset} أيام`, tone: "upcoming" };
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const profile = JSON.parse(localStorage.getItem("munjez_profile") || "null");
        if (profile?.name) setProfileName(profile.name);

        const supabase = createUserClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw new Error("تعذّر التحقق من هوية المستخدم.");
        }

        const cloudTasks = await listTasks(supabase, userData.user.id);

        if (!cancelled) {
          setTasks(cloudTasks);
          setHydrated(true);
        }
      } catch {
        if (!cancelled) {
          setLoadError("تعذّر تحميل مهامك من الخادم. تحقق من اتصالك بالإنترنت وأعد تحميل الصفحة.");
          setHydrated(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = tasks.filter((task) => !task.archived);
  const archivedTasks = tasks.filter((task) => task.archived);
  const completedCount = active.filter((task) => task.done).length;
  const todayCount = active.filter((task) => daysFromToday(task.date) === 0).length;
  const lateCount = active.filter((task) => !task.done && daysFromToday(task.date) < 0).length;
  const sortedTasks = useMemo(() => [...active].sort((a, b) => Number(a.done) - Number(b.done) || daysFromToday(a.date) - daysFromToday(b.date)), [active]);
  const tasksForOffset = (offset: number) => active.filter((task) => !task.done && daysFromToday(task.date) === offset);

  const [goals, setGoals] = useState<CloudGoal[]>([]);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState("");

  const loadGoals = async () => {
    setGoalsLoading(true);
    setGoalsError("");
    try {
      const supabase = createUserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("تعذّر التحقق من هوية المستخدم.");
      }
      const cloudGoals = await listGoals(supabase, userData.user.id);
      setGoals(cloudGoals);
      setGoalsLoaded(true);
    } catch {
      setGoalsError("تعذّر تحميل الأهداف من الخادم.");
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "goals" && !goalsLoaded) loadGoals();
  };

  if (!hydrated) {
    return <main className="task-app" dir="rtl"><div className="task-shell"><p>جارٍ تحميل مهامك...</p></div></main>;
  }

  if (loadError) {
    return <main className="task-app" dir="rtl"><div className="task-shell"><p className="task-status late">{loadError}</p></div></main>;
  }

  return <><main className="task-app" dir="rtl">
    <header className="task-topbar">
      <Link className="task-brand" href="/"><img src="/hourglass-logo.png" alt="شعار رحلة مُنجِز" /><strong>رحـلـة مُـنـجِـز</strong></Link>
      <div className="task-top-actions"><Link className="full-platform-link" href="/munjez-platform.html">فتح منصة مُنجِز الكاملة <ArrowUpLeft size={17} /></Link><Link className="back-to-site" href="/">العودة للموقع <ArrowLeft size={17} /></Link></div>
    </header>

    <div className="task-shell">
      <div className="task-heading"><div><span>{profileName ? `مرحبًا، ${profileName}` : "لوحتك المختصرة · التسجيل اختياري"}</span><h1>إدارة المهام</h1><p>نظرة سريعة على يومك، بينما تجد التفاصيل الكاملة داخل منصة مُنجِز.</p></div><time>{dateLabel(dateKey(0))}</time></div>
      <section className="task-stats"><article><span>مهام اليوم</span><b>{todayCount}</b></article><article><span>مكتملة</span><b>{completedCount}</b></article><article><span>متأخرة</span><b>{lateCount}</b></article><article><span>إجمالي المهام</span><b>{active.length}</b></article></section>

      <Tabs defaultValue="tasks" className="task-tabs" dir="rtl" onValueChange={handleTabChange}>
        <TabsList variant="line" className="task-tabs-list"><TabsTrigger value="tasks">المهام</TabsTrigger><TabsTrigger value="achievements">الإنجازات</TabsTrigger><TabsTrigger value="goals">الأهداف</TabsTrigger><TabsTrigger value="calendar">التقويم</TabsTrigger></TabsList>
        <TabsContent value="tasks">
          <section className="task-panel"><div className="panel-title"><div><h2>مهامك</h2><span>{active.length} مهام</span></div></div>
            <div className="task-list">{sortedTasks.map((task) => { const status = statusFor(task); return <article className={task.done ? "is-complete" : ""} key={task.id}><Checkbox checked={task.done} disabled aria-label={`${task.name}: ${task.done ? "مكتملة" : "غير مكتملة"}`} /><div className="task-name"><strong>{task.name}</strong><span>{dateLabel(task.date)}{task.from ? ` · ${timeLabel(task.from)}` : ""}</span></div><span className={`task-status ${status.tone}`}>{status.label}</span></article>; })}</div>
          </section>
          <section className="archive-panel"><h2><Archive size={18} /> الأرشيف</h2>{archivedTasks.length ? archivedTasks.map((task) => <div key={task.id}><span>{task.name}</span></div>) : <p>ستظهر هنا المهام المكتملة بعد أرشفتها.</p>}</section>
        </TabsContent>

        <TabsContent value="achievements"><section className="task-cards-grid"><article><CheckCircle2 /><span>هذا الأسبوع</span><h2>أكملت {completedCount} مهام</h2><p>كل خطوة مكتملة تُضاف إلى سجل تقدّمك.</p></article><article><CheckCircle2 /><span>إنجاز جديد</span><h2>إكمال مراجعة الوحدة الأولى</h2><p>جلسة مركزة لمدة خمس وأربعين دقيقة.</p></article><article><CheckCircle2 /><span>الاستمرارية</span><h2>3 جلسات قراءة</h2><p>ساعة وخمس وأربعون دقيقة من القراءة المركزة.</p></article></section></TabsContent>

        <TabsContent value="goals">
          {goalsError && <p className="task-status late" role="alert">{goalsError}</p>}
          {goalsLoading && <p style={{ padding: "20px" }}>جارٍ تحميل الأهداف...</p>}
          {!goalsLoading && (
            <div className="goals-cloud-list">
              {goals.length === 0 && <div className="goals-empty">لا توجد أهداف بعد.</div>}
              {goals.map((goal) => (
                <div className={`gcard${goal.done ? " done-g" : ""}`} key={goal.id}>
                  <span className={`g-check${goal.done ? " on" : ""}`} aria-hidden="true" />
                  <div className="g-body">
                    <div className="g-name">{goal.name}</div>
                    <div className="g-badges">
                      <span className={`g-cat ${GOAL_CAT_CLASS[goal.cat] ?? "gc-other"}`}>{goal.cat}</span>
                      {goal.imp && <span className="g-imp">مهم</span>}
                      {goal.ach && <span className="g-ach-badge">ينتقل للإنجازات</span>}
                    </div>
                    {goal.note && <div className="g-notes">{goal.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar"><section className="calendar-view"><div className="calendar-day is-today"><b>اليوم</b><strong>{dateLabel(dateKey(0))}</strong>{tasksForOffset(0).map((task) => <span key={task.id}>{task.name}</span>)}</div><div className="calendar-day"><b>غدًا</b><strong>{dateLabel(dateKey(1))}</strong>{tasksForOffset(1).map((task) => <span key={task.id}>{task.name}</span>)}</div><div className="calendar-day"><b>قادم</b><strong>{dateLabel(dateKey(4))}</strong>{tasksForOffset(4).map((task) => <span key={task.id}>{task.name}</span>)}</div><CalendarDays size={28} /></section></TabsContent>
      </Tabs>

      <section className="platform-handoff"><div><span>تحتاج التفاصيل؟</span><h2>كل أدوات مُنجِز في مكان واحد</h2><p>افتح المنصة الكاملة لإدارة المواعيد، المهام المتكررة، سجل الإنجازات، الأهداف والتقويم الأسبوعي والشهري.</p></div><Link href="/munjez-platform.html">الانتقال إلى منصة مُنجِز <ArrowLeft size={18} /></Link></section>
    </div>
  </main><MunjezFooter /></>;
}
