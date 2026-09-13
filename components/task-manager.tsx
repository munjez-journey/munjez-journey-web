"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowLeft, ArrowUpLeft, CalendarDays, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MunjezFooter } from "@/components/site-chrome";
import { createUserClient } from "@/lib/supabase/userClient";
import { insertTask, updateTask, deleteTask, listTasks, type CloudTask, insertGoal, updateGoal, deleteGoal, listGoals, type CloudGoal } from "@/lib/tasks/cloudStore";
import { migrateLocalStorageIfNeeded } from "@/lib/tasks/migrateLocalStorage";

type Task = CloudTask;
const DEMO_DATA_VERSION = 5;

function dateKey(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// شكل محلي فقط (id رقمي) يُستخدم حصراً لتوليد بيانات العرض الأولى في
// localStorage قبل الترحيل إلى Supabase؛ لا علاقة له بنوع Task السحابي.
type LocalSeedTask = { id: number; name: string; date: string; from: string; to: string; achieve: boolean; done: boolean; archived: boolean };

function defaultTasks(): LocalSeedTask[] {
  return [
    { id: 1, name: "مراجعة ملخص المحاضرة", date: dateKey(0), from: "10:00", to: "", achieve: true, done: false, archived: false },
    { id: 2, name: "رفع النسخة النهائية للعرض", date: dateKey(0), from: "18:00", to: "", achieve: true, done: false, archived: false },
    { id: 3, name: "المشي ثلاثين دقيقة", date: dateKey(0), from: "", to: "", achieve: true, done: true, archived: false },
    { id: 4, name: "الاتصال بالمرشد الأكاديمي", date: dateKey(1), from: "13:30", to: "", achieve: false, done: false, archived: false },
    { id: 5, name: "تسليم مشروع مادة التسويق", date: dateKey(4), from: "23:59", to: "", achieve: true, done: false, archived: false },
    { id: 6, name: "ترتيب ملفات الأسبوع", date: dateKey(-2), from: "", to: "", achieve: false, done: false, archived: false },
  ];
}

function seedFullPlatformData(tasks: LocalSeedTask[]) {
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // يبقي هذا كما كان تماماً: يضمن وجود بيانات تجريبية محلية عند أول
        // زيارة على الإطلاق، قبل أن يتولى الترحيل رفعها إلى Supabase.
        const version = Number(localStorage.getItem("mj_demo_data_version") || 0);
        if (version < DEMO_DATA_VERSION) {
          seedFullPlatformData(defaultTasks());
        }
        const profile = JSON.parse(localStorage.getItem("munjez_profile") || "null");
        if (profile?.name) setProfileName(profile.name);

        const supabase = createUserClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw new Error("تعذّر التحقق من هوية المستخدم.");
        }

        const migration = await migrateLocalStorageIfNeeded(supabase, userData.user.id);
        if (migration.error) {
          console.warn("تعذّر ترحيل بيانات المتصفح القديمة إلى السحابة:", migration.error);
        }

        const cloudTasks = await listTasks(supabase, userData.user.id);

        if (!cancelled) {
          setUserId(userData.user.id);
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
  const completedCount = active.filter((task) => task.done).length;
  const todayCount = active.filter((task) => daysFromToday(task.date) === 0).length;
  const lateCount = active.filter((task) => !task.done && daysFromToday(task.date) < 0).length;
  const sortedTasks = useMemo(() => [...active].sort((a, b) => Number(a.done) - Number(b.done) || daysFromToday(a.date) - daysFromToday(b.date)), [active]);

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = title.trim();
    if (!name || !userId) return;
    setTitle("");
    setActionError("");
    try {
      const supabase = createUserClient();
      const inserted = await insertTask(supabase, userId, { name, date: dateKey(0), from: "", to: "", achieve: false, done: false, archived: false });
      setTasks((current) => [inserted, ...current]);
    } catch {
      setActionError("تعذّر إضافة المهمة، حاول مرة أخرى.");
    }
  };

  const toggleDone = (task: Task, done: boolean) => {
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done } : item));
    setActionError("");
    updateTask(createUserClient(), task.id, { done }).catch(() => setActionError("تعذّر حفظ حالة المهمة."));
  };

  const removeTask = (task: Task) => {
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setActionError("");
    deleteTask(createUserClient(), task.id).catch(() => setActionError("تعذّر حذف المهمة."));
  };

  const archiveCompleted = () => {
    const toArchive = active.filter((task) => task.done);
    if (toArchive.length === 0) return;
    setTasks((current) => current.map((task) => task.done ? { ...task, archived: true } : task));
    setActionError("");
    const supabase = createUserClient();
    Promise.all(toArchive.map((task) => updateTask(supabase, task.id, { archived: true }))).catch(() =>
      setActionError("تعذّر أرشفة بعض المهام.")
    );
  };

  const restoreTask = (task: Task) => {
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, archived: false } : item));
    setActionError("");
    updateTask(createUserClient(), task.id, { archived: false }).catch(() => setActionError("تعذّر استعادة المهمة."));
  };

  const tasksForOffset = (offset: number) => active.filter((task) => !task.done && daysFromToday(task.date) === offset);

  const [goals, setGoals] = useState<CloudGoal[]>([]);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState("");
  const emptyGoalForm = { id: null as string | null, name: "", cat: "", note: "", imp: false, ach: false };
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [goalSaving, setGoalSaving] = useState(false);

  const loadGoals = async () => {
    if (!userId) return;
    setGoalsLoading(true);
    setGoalsError("");
    try {
      const supabase = createUserClient();
      const cloudGoals = await listGoals(supabase, userId);
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

  const startEditGoal = (goal: CloudGoal) => {
    setGoalsError("");
    setGoalForm({ id: goal.id, name: goal.name, cat: goal.cat, note: goal.note ?? "", imp: goal.imp, ach: goal.ach });
  };

  const resetGoalForm = () => setGoalForm(emptyGoalForm);

  const submitGoalForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = goalForm.name.trim();
    if (!name || !userId) return;
    const payload = { name, cat: goalForm.cat.trim(), note: goalForm.note.trim() || null, imp: goalForm.imp, ach: goalForm.ach };
    setGoalSaving(true);
    setGoalsError("");
    try {
      const supabase = createUserClient();
      if (goalForm.id) {
        await updateGoal(supabase, goalForm.id, payload);
        setGoals((current) => current.map((g) => g.id === goalForm.id ? { ...g, ...payload } : g));
      } else {
        const inserted = await insertGoal(supabase, userId, { ...payload, done: false });
        setGoals((current) => [inserted, ...current]);
      }
      resetGoalForm();
    } catch {
      setGoalsError(goalForm.id ? "تعذّر حفظ تعديل الهدف." : "تعذّر إضافة الهدف.");
    } finally {
      setGoalSaving(false);
    }
  };

  const toggleGoalDone = (goal: CloudGoal, done: boolean) => {
    setGoals((current) => current.map((item) => item.id === goal.id ? { ...item, done } : item));
    setGoalsError("");
    updateGoal(createUserClient(), goal.id, { done }).catch(() => setGoalsError("تعذّر حفظ حالة الهدف."));
  };

  const removeGoal = (goal: CloudGoal) => {
    setGoals((current) => current.filter((item) => item.id !== goal.id));
    setGoalsError("");
    deleteGoal(createUserClient(), goal.id).catch(() => setGoalsError("تعذّر حذف الهدف."));
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
          {actionError && <p className="task-status late" role="alert">{actionError}</p>}
          <form className="quick-add" onSubmit={addTask}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ما المهمة التي تريد إنجازها اليوم؟" aria-label="اسم المهمة" /><button type="submit"><Plus size={18} /> إضافة</button></form>
          <section className="task-panel"><div className="panel-title"><div><h2>مهامك</h2><span>{active.length} مهام</span></div><button onClick={archiveCompleted}><Archive size={17} /> أرشفة المكتملة</button></div>
            <div className="task-list">{sortedTasks.map((task) => { const status = statusFor(task); return <article className={task.done ? "is-complete" : ""} key={task.id}><Checkbox checked={task.done} onCheckedChange={(checked) => toggleDone(task, Boolean(checked))} aria-label={`إكمال ${task.name}`} /><div className="task-name"><strong>{task.name}</strong><span>{dateLabel(task.date)}{task.from ? ` · ${timeLabel(task.from)}` : ""}</span></div><span className={`task-status ${status.tone}`}>{status.label}</span><button className="task-delete" onClick={() => removeTask(task)} aria-label={`حذف ${task.name}`}><Trash2 size={16} /></button></article>; })}</div>
          </section>
          <section className="archive-panel"><h2><Archive size={18} /> الأرشيف</h2>{tasks.filter((task) => task.archived).length ? tasks.filter((task) => task.archived).map((task) => <div key={task.id}><span>{task.name}</span><button onClick={() => restoreTask(task)}>استعادة</button></div>) : <p>ستظهر هنا المهام المكتملة بعد أرشفتها.</p>}</section>
        </TabsContent>

        <TabsContent value="achievements"><section className="task-cards-grid"><article><CheckCircle2 /><span>هذا الأسبوع</span><h2>أكملت {completedCount} مهام</h2><p>كل خطوة مكتملة تُضاف إلى سجل تقدّمك.</p></article><article><CheckCircle2 /><span>إنجاز جديد</span><h2>إكمال مراجعة الوحدة الأولى</h2><p>جلسة مركزة لمدة خمس وأربعين دقيقة.</p></article><article><CheckCircle2 /><span>الاستمرارية</span><h2>3 جلسات قراءة</h2><p>ساعة وخمس وأربعون دقيقة من القراءة المركزة.</p></article></section></TabsContent>
        <TabsContent value="goals">
          {goalsError && <p className="task-status late" role="alert">{goalsError}</p>}
          <form className="goal-form" onSubmit={submitGoalForm}>
            <div className="goal-form-row">
              <input value={goalForm.name} onChange={(event) => setGoalForm((f) => ({ ...f, name: event.target.value }))} placeholder="اسم الهدف" aria-label="اسم الهدف" required />
              <input value={goalForm.cat} onChange={(event) => setGoalForm((f) => ({ ...f, cat: event.target.value }))} placeholder="التصنيف (مثل: تعليم، صحة)" aria-label="تصنيف الهدف" />
            </div>
            <div className="goal-form-row">
              <input value={goalForm.note} onChange={(event) => setGoalForm((f) => ({ ...f, note: event.target.value }))} placeholder="ملاحظة (اختياري)" aria-label="ملاحظة الهدف" />
            </div>
            <div className="goal-form-row goal-form-checks">
              <label><input type="checkbox" checked={goalForm.imp} onChange={(event) => setGoalForm((f) => ({ ...f, imp: event.target.checked }))} /> هدف مهم</label>
              <label><input type="checkbox" checked={goalForm.ach} onChange={(event) => setGoalForm((f) => ({ ...f, ach: event.target.checked }))} /> يُحتسب كإنجاز عند إتمامه</label>
            </div>
            <div className="goal-form-actions">
              <button type="submit" disabled={goalSaving}>{goalSaving ? "جارٍ الحفظ..." : goalForm.id ? "حفظ التعديل" : "إضافة هدف"}</button>
              {goalForm.id && <button type="button" onClick={resetGoalForm}>إلغاء</button>}
            </div>
          </form>

          <section className="task-panel">
            <div className="panel-title"><div><h2>أهدافك</h2><span>{goals.length} أهداف</span></div></div>
            <div className="task-list">
              {goalsLoading && <p style={{ padding: "20px" }}>جارٍ تحميل الأهداف...</p>}
              {!goalsLoading && goals.length === 0 && <p style={{ padding: "20px" }}>لا توجد أهداف بعد. أضف أول هدف من الأعلى.</p>}
              {!goalsLoading && goals.map((goal) => (
                <article className={goal.done ? "is-complete" : ""} key={goal.id}>
                  <Checkbox checked={goal.done} onCheckedChange={(checked) => toggleGoalDone(goal, Boolean(checked))} aria-label={`إكمال هدف ${goal.name}`} />
                  <div className="task-name"><strong>{goal.name}</strong><span>{goal.cat || "بدون تصنيف"}{goal.note ? ` · ${goal.note}` : ""}</span></div>
                  <span className={`task-status ${goal.imp ? "late" : "upcoming"}`}>{goal.imp ? "مهم" : "عادي"}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="task-delete" onClick={() => startEditGoal(goal)} aria-label={`تعديل ${goal.name}`}><Pencil size={16} /></button>
                    <button className="task-delete" onClick={() => removeGoal(goal)} aria-label={`حذف ${goal.name}`}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </TabsContent>
        <TabsContent value="calendar"><section className="calendar-view"><div className="calendar-day is-today"><b>اليوم</b><strong>{dateLabel(dateKey(0))}</strong>{tasksForOffset(0).map((task) => <span key={task.id}>{task.name}</span>)}</div><div className="calendar-day"><b>غدًا</b><strong>{dateLabel(dateKey(1))}</strong>{tasksForOffset(1).map((task) => <span key={task.id}>{task.name}</span>)}</div><div className="calendar-day"><b>قادم</b><strong>{dateLabel(dateKey(4))}</strong>{tasksForOffset(4).map((task) => <span key={task.id}>{task.name}</span>)}</div><CalendarDays size={28} /></section></TabsContent>
      </Tabs>

      <section className="platform-handoff"><div><span>تحتاج التفاصيل؟</span><h2>كل أدوات مُنجِز في مكان واحد</h2><p>افتح المنصة الكاملة لإدارة المواعيد، المهام المتكررة، سجل الإنجازات، الأهداف والتقويم الأسبوعي والشهري.</p></div><Link href="/munjez-platform.html">الانتقال إلى منصة مُنجِز <ArrowLeft size={18} /></Link></section>
    </div>
  </main><MunjezFooter /></>;
}
