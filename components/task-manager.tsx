"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowLeft, ArrowUpLeft, CalendarDays, CheckCircle2, Flag, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MunjezFooter } from "@/components/site-chrome";

type Task = { id: number; name: string; date: string; from: string; to: string; achieve: boolean; done: boolean; archived: boolean };
const DEMO_DATA_VERSION = 5;

function dateKey(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function defaultTasks(): Task[] {
  return [
    { id: 1, name: "مراجعة ملخص المحاضرة", date: dateKey(0), from: "10:00", to: "", achieve: true, done: false, archived: false },
    { id: 2, name: "رفع النسخة النهائية للعرض", date: dateKey(0), from: "18:00", to: "", achieve: true, done: false, archived: false },
    { id: 3, name: "المشي ثلاثين دقيقة", date: dateKey(0), from: "", to: "", achieve: true, done: true, archived: false },
    { id: 4, name: "الاتصال بالمرشد الأكاديمي", date: dateKey(1), from: "13:30", to: "", achieve: false, done: false, archived: false },
    { id: 5, name: "تسليم مشروع مادة التسويق", date: dateKey(4), from: "23:59", to: "", achieve: true, done: false, archived: false },
    { id: 6, name: "ترتيب ملفات الأسبوع", date: dateKey(-2), from: "", to: "", achieve: false, done: false, archived: false },
  ];
}

function seedFullPlatformData(tasks: Task[]) {
  const achievements = [
    { id: 100, name: "إكمال مراجعة الوحدة الأولى", date: dateKey(-1), cat: "تعليمي", note: "جلسة مركزة لمدة خمس وأربعين دقيقة", imgs: [], files: [], feat: true },
    { id: 101, name: "المشي ثلاثين دقيقة", date: dateKey(0), cat: "رياضي", note: null, imgs: [], files: [], feat: false },
  ];
  const goals = [
    { id: 200, name: "إنهاء الفصل الأول من البحث", cat: "تعليم", imp: true, note: "تقسيمه إلى ثلاث جلسات قصيرة", done: false, ach: true },
    { id: 201, name: "اثنتا عشرة جلسة قراءة هذا الشهر", cat: "شخصي", imp: false, note: "جلسات قصيرة قابلة للاستمرار", done: false, ach: true },
    { id: 202, name: "المشي أربع مرات أسبوعيًا", cat: "صحة", imp: false, note: null, done: false, ach: false },
  ];
  const recurring = [
    { id: 300, name: "مراجعة الخطة اليومية", freq: "daily", weekday: null, from: "08:00", achieve: false, active: true, done: false },
    { id: 301, name: "ترتيب مساحة الدراسة", freq: "weekly", weekday: 4, from: "19:00", achieve: false, active: true, done: false },
  ];
  localStorage.setItem("mj_tasks", JSON.stringify(tasks));
  localStorage.setItem("mj_ach", JSON.stringify(achievements));
  localStorage.setItem("mj_goals", JSON.stringify(goals));
  localStorage.setItem("mj_rec", JSON.stringify(recurring));
  localStorage.setItem("mj_nid", "400");
  localStorage.setItem("mj_demo_data_version", String(DEMO_DATA_VERSION));
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
  const [tasks, setTasks] = useState<Task[]>(() => defaultTasks());
  const [title, setTitle] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    try {
      const version = Number(localStorage.getItem("mj_demo_data_version") || 0);
      if (version < DEMO_DATA_VERSION) {
        const fresh = defaultTasks();
        seedFullPlatformData(fresh);
        setTasks(fresh);
      } else {
        const saved = JSON.parse(localStorage.getItem("mj_tasks") || "null");
        if (Array.isArray(saved)) setTasks(saved);
      }
      const profile = JSON.parse(localStorage.getItem("munjez_profile") || "null");
      if (profile?.name) setProfileName(profile.name);
    } catch { seedFullPlatformData(defaultTasks()); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("mj_tasks", JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const active = tasks.filter((task) => !task.archived);
  const completedCount = active.filter((task) => task.done).length;
  const todayCount = active.filter((task) => daysFromToday(task.date) === 0).length;
  const lateCount = active.filter((task) => !task.done && daysFromToday(task.date) < 0).length;
  const sortedTasks = useMemo(() => [...active].sort((a, b) => Number(a.done) - Number(b.done) || daysFromToday(a.date) - daysFromToday(b.date)), [active]);

  const addTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setTasks((current) => [{ id: Date.now(), name: title.trim(), date: dateKey(0), from: "", to: "", achieve: false, done: false, archived: false }, ...current]);
    setTitle("");
  };

  const tasksForOffset = (offset: number) => active.filter((task) => !task.done && daysFromToday(task.date) === offset);

  return <><main className="task-app" dir="rtl">
    <header className="task-topbar">
      <Link className="task-brand" href="/"><img src="/hourglass-logo.png" alt="شعار رحلة مُنجِز" /><strong>رحـلـة مُـنـجِـز</strong></Link>
      <div className="task-top-actions"><Link className="full-platform-link" href="/munjez-platform.html">فتح منصة مُنجِز الكاملة <ArrowUpLeft size={17} /></Link><Link className="back-to-site" href="/">العودة للموقع <ArrowLeft size={17} /></Link></div>
    </header>

    <div className="task-shell">
      <div className="task-heading"><div><span>{profileName ? `مرحبًا، ${profileName}` : "لوحتك المختصرة · التسجيل اختياري"}</span><h1>إدارة المهام</h1><p>نظرة سريعة على يومك، بينما تجد التفاصيل الكاملة داخل منصة مُنجِز.</p></div><time>{dateLabel(dateKey(0))}</time></div>
      <section className="task-stats"><article><span>مهام اليوم</span><b>{todayCount}</b></article><article><span>مكتملة</span><b>{completedCount}</b></article><article><span>متأخرة</span><b>{lateCount}</b></article><article><span>إجمالي المهام</span><b>{active.length}</b></article></section>

      <Tabs defaultValue="tasks" className="task-tabs" dir="rtl">
        <TabsList variant="line" className="task-tabs-list"><TabsTrigger value="tasks">المهام</TabsTrigger><TabsTrigger value="achievements">الإنجازات</TabsTrigger><TabsTrigger value="goals">الأهداف</TabsTrigger><TabsTrigger value="calendar">التقويم</TabsTrigger></TabsList>
        <TabsContent value="tasks">
          <form className="quick-add" onSubmit={addTask}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ما المهمة التي تريد إنجازها اليوم؟" aria-label="اسم المهمة" /><button type="submit"><Plus size={18} /> إضافة</button></form>
          <section className="task-panel"><div className="panel-title"><div><h2>مهامك</h2><span>{active.length} مهام</span></div><button onClick={() => setTasks((current) => current.map((task) => task.done ? { ...task, archived: true } : task))}><Archive size={17} /> أرشفة المكتملة</button></div>
            <div className="task-list">{sortedTasks.map((task) => { const status = statusFor(task); return <article className={task.done ? "is-complete" : ""} key={task.id}><Checkbox checked={task.done} onCheckedChange={(checked) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: Boolean(checked) } : item))} aria-label={`إكمال ${task.name}`} /><div className="task-name"><strong>{task.name}</strong><span>{dateLabel(task.date)}{task.from ? ` · ${timeLabel(task.from)}` : ""}</span></div><span className={`task-status ${status.tone}`}>{status.label}</span><button className="task-delete" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label={`حذف ${task.name}`}><Trash2 size={16} /></button></article>; })}</div>
          </section>
          <section className="archive-panel"><h2><Archive size={18} /> الأرشيف</h2>{tasks.filter((task) => task.archived).length ? tasks.filter((task) => task.archived).map((task) => <div key={task.id}><span>{task.name}</span><button onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, archived: false } : item))}>استعادة</button></div>) : <p>ستظهر هنا المهام المكتملة بعد أرشفتها.</p>}</section>
        </TabsContent>

        <TabsContent value="achievements"><section className="task-cards-grid"><article><CheckCircle2 /><span>هذا الأسبوع</span><h2>أكملت {completedCount} مهام</h2><p>كل خطوة مكتملة تُضاف إلى سجل تقدّمك.</p></article><article><CheckCircle2 /><span>إنجاز جديد</span><h2>إكمال مراجعة الوحدة الأولى</h2><p>جلسة مركزة لمدة خمس وأربعين دقيقة.</p></article><article><CheckCircle2 /><span>الاستمرارية</span><h2>3 جلسات قراءة</h2><p>ساعة وخمس وأربعون دقيقة من القراءة المركزة.</p></article></section></TabsContent>
        <TabsContent value="goals"><section className="goals-list"><article><div><Flag /><span>الدراسة</span><h2>إنهاء الفصل الأول من البحث</h2></div><b>65%</b><div className="goal-progress"><i style={{ width: "65%" }} /></div></article><article><div><Flag /><span>العادات</span><h2>12 جلسة قراءة هذا الشهر</h2></div><b>8 من 12</b><div className="goal-progress"><i style={{ width: "67%" }} /></div></article><article><div><Flag /><span>الصحة</span><h2>المشي أربع مرات أسبوعيًا</h2></div><b>3 من 4</b><div className="goal-progress"><i style={{ width: "75%" }} /></div></article></section></TabsContent>
        <TabsContent value="calendar"><section className="calendar-view"><div className="calendar-day is-today"><b>اليوم</b><strong>{dateLabel(dateKey(0))}</strong>{tasksForOffset(0).map((task) => <span key={task.id}>{task.name}</span>)}</div><div className="calendar-day"><b>غدًا</b><strong>{dateLabel(dateKey(1))}</strong>{tasksForOffset(1).map((task) => <span key={task.id}>{task.name}</span>)}</div><div className="calendar-day"><b>قادم</b><strong>{dateLabel(dateKey(4))}</strong>{tasksForOffset(4).map((task) => <span key={task.id}>{task.name}</span>)}</div><CalendarDays size={28} /></section></TabsContent>
      </Tabs>

      <section className="platform-handoff"><div><span>تحتاج التفاصيل؟</span><h2>كل أدوات مُنجِز في مكان واحد</h2><p>افتح المنصة الكاملة لإدارة المواعيد، المهام المتكررة، سجل الإنجازات، الأهداف والتقويم الأسبوعي والشهري.</p></div><Link href="/munjez-platform.html">الانتقال إلى منصة مُنجِز <ArrowLeft size={18} /></Link></section>
    </div>
  </main><MunjezFooter /></>;
}
