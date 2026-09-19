"use client";

import { useEffect, useState } from "react";
import { createUserClient } from "@/lib/supabase/userClient";
import { listTasks, insertTask, updateTask, deleteTask, type CloudTask } from "@/lib/tasks/cloudStore";
import TimePicker from "./TimePicker";
import RecurringSection from "./RecurringSection";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - startOfToday().getTime()) / 86400000);
}

type Status = "today" | "overdue" | "done" | "upcoming" | "backlog";

function getStatus(task: CloudTask): Status {
  if (task.done) return "done";
  if (!task.date) return "backlog";
  const n = daysUntil(task.date);
  if (n < 0) return "overdue";
  if (n === 0) return "today";
  return "upcoming";
}

function daysLate(dateStr: string) {
  return Math.max(0, -daysUntil(dateStr));
}

function dlStr(n: number) {
  if (n === 1) return "تأخرت يوم";
  if (n === 2) return "تأخرت يومين";
  return `تأخرت ${n} أيام`;
}

function dueLabel(dateStr: string): { txt: string } {
  const n = daysUntil(dateStr);
  if (n < 0) return { txt: dlStr(Math.abs(n)) };
  if (n === 0) return { txt: "اليوم" };
  if (n === 1) return { txt: "متبقي يوم" };
  if (n === 2) return { txt: "متبقي يومين" };
  return { txt: `متبقي ${n} أيام` };
}

function fmtTime(time: string) {
  if (!time) return "";
  const [hh, mm] = time.split(":");
  const n = Number(hh);
  const h12 = n % 12 || 12;
  return `${h12}:${mm}${n < 12 ? " AM" : " PM"}`;
}

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function fmtDay(dateStr: string) {
  if (!dateStr) return "—";
  return DAYS[new Date(`${dateStr}T12:00:00`).getDay()];
}

type MainTab = "sched" | "backlog" | "rec";
type SubFilter = "today" | "upcoming" | "overdue" | "done" | "archived" | "all";

const emptyForm = { name: "", date: "", from: "", to: "", achieve: false };

export default function TasksTab({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<CloudTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);

  const [mainTab, setMainTab] = useState<MainTab>("sched");
  const [subFilter, setSubFilter] = useState<SubFilter>("today");
  const [search, setSearch] = useState("");

  const [editingTask, setEditingTask] = useState<CloudTask | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const supabase = createUserClient();
        const cloudTasks = await listTasks(supabase, userId);
        if (!cancelled) setTasks(cloudTasks);
      } catch {
        if (!cancelled) setLoadError("تعذّر تحميل المهام من الخادم. تحقق من اتصالك وأعد تحميل الصفحة.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const active = tasks.filter((t) => !t.archived);
  const todayCount = active.filter((t) => !t.done && getStatus(t) === "today").length;
  const overdueCount = active.filter((t) => !t.done && getStatus(t) === "overdue").length;
  const doneCount = active.filter((t) => t.done).length;
  const totalCount = active.length;

  const q = search.trim().toLowerCase();

  let schedList = subFilter === "archived" ? tasks.filter((t) => t.archived) : tasks.filter((t) => t.date && !t.archived);
  if (q) schedList = schedList.filter((t) => t.name.toLowerCase().includes(q));
  if (subFilter !== "all" && subFilter !== "archived") {
    schedList = subFilter === "done" ? schedList.filter((t) => t.done) : schedList.filter((t) => !t.done && getStatus(t) === subFilter);
  }
  schedList = [...schedList].sort((a, b) => a.date.localeCompare(b.date));

  let backlogList = tasks.filter((t) => !t.date && !t.archived);
  if (q) backlogList = backlogList.filter((t) => t.name.toLowerCase().includes(q));

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    setAdding(true);
    setActionError("");
    try {
      const supabase = createUserClient();
      const inserted = await insertTask(supabase, userId, {
        name,
        date: form.date,
        from: form.from,
        to: form.to,
        achieve: form.achieve,
        done: false,
        archived: false,
      });
      setTasks((current) => [inserted, ...current]);
      setForm(emptyForm);
    } catch {
      setActionError("تعذّر إضافة المهمة، حاول مرة أخرى.");
    } finally {
      setAdding(false);
    }
  }

  function toggleDone(task: CloudTask) {
    const done = !task.done;
    setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, done } : t)));
    setActionError("");
    updateTask(createUserClient(), task.id, { done }).catch(() => setActionError("تعذّر حفظ حالة المهمة."));
  }

  function setArchived(task: CloudTask, archived: boolean) {
    setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, archived } : t)));
    setActionError("");
    updateTask(createUserClient(), task.id, { archived }).catch(() =>
      setActionError(archived ? "تعذّر أرشفة المهمة." : "تعذّر استعادة المهمة.")
    );
  }

  function removeTask(task: CloudTask) {
    setTasks((current) => current.filter((t) => t.id !== task.id));
    setActionError("");
    deleteTask(createUserClient(), task.id).catch(() => setActionError("تعذّر حذف المهمة."));
  }

  function openEdit(task: CloudTask) {
    setActionError("");
    setEditingTask(task);
    setEditForm({ name: task.name, date: task.date, from: task.from, to: task.to, achieve: task.achieve });
  }

  function closeEdit() {
    setEditingTask(null);
    setEditForm(emptyForm);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingTask) return;
    const name = editForm.name.trim();
    if (!name) return;
    setEditSaving(true);
    setActionError("");
    try {
      const supabase = createUserClient();
      await updateTask(supabase, editingTask.id, { name, date: editForm.date, from: editForm.from, to: editForm.to, achieve: editForm.achieve });
      setTasks((current) => current.map((t) => (t.id === editingTask.id ? { ...t, name, date: editForm.date, from: editForm.from, to: editForm.to, achieve: editForm.achieve } : t)));
      closeEdit();
    } catch {
      setActionError("تعذّر حفظ تعديل المهمة.");
    } finally {
      setEditSaving(false);
    }
  }

  if (loading) {
    return <p style={{ padding: "20px" }}>جارٍ تحميل المهام...</p>;
  }

  if (loadError) {
    return <p className="task-status late" role="alert">{loadError}</p>;
  }

  return (
    <div>
      {actionError && <p className="task-status late" role="alert" style={{ marginBottom: 10 }}>{actionError}</p>}

      <div className="t-summary">
        <div className="tsc td-c"><div className="tsc-num">{todayCount}</div><div className="tsc-lbl">مهام اليوم</div></div>
        <div className="tsc ov-c"><div className="tsc-num">{overdueCount}</div><div className="tsc-lbl">متأخرة</div></div>
        <div className="tsc dn-c"><div className="tsc-num">{doneCount}</div><div className="tsc-lbl">مكتملة</div></div>
        <div className="tsc tot-c"><div className="tsc-num">{totalCount}</div><div className="tsc-lbl">الإجمالي</div></div>
      </div>

      <form className="add-box" onSubmit={handleAdd}>
        <div className="add-lbl">إضافة مهمة جديدة</div>
        <div className="add-main">
          <div className="fl"><label>المهمة *</label><input className="inp" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="اسم المهمة..." required /></div>
          <div className="fl"><label>التاريخ (اختياري)</label><input className="inp" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
          <button className="badd" type="submit" disabled={adding}>{adding ? "جارٍ الإضافة..." : "إضافة"}</button>
        </div>
        <div className="add-extra">
          <div className="fl"><label>من (اختياري)</label><TimePicker value={form.from} onChange={(v) => setForm((f) => ({ ...f, from: v }))} /></div>
          <div className="fl"><label>إلى (اختياري)</label><TimePicker value={form.to} onChange={(v) => setForm((f) => ({ ...f, to: v }))} /></div>
          <div className="fl" style={{ justifyContent: "flex-end" }}>
            <div className="ach-opt" style={{ marginTop: "auto" }}>
              <input type="checkbox" id="f-ach" checked={form.achieve} onChange={(e) => setForm((f) => ({ ...f, achieve: e.target.checked }))} />
              <label htmlFor="f-ach">أضف للإنجازات عند الإكمال</label>
            </div>
          </div>
        </div>
      </form>

      <div className="tbar">
        <div className="ftabs">
          <button type="button" className={`ftab${mainTab === "sched" ? " active" : ""}`} onClick={() => setMainTab("sched")}>المجدولة</button>
          <button type="button" className={`ftab${mainTab === "backlog" ? " active" : ""}`} onClick={() => setMainTab("backlog")}>بدون تاريخ</button>
          <button type="button" className={`ftab${mainTab === "rec" ? " active" : ""}`} onClick={() => setMainTab("rec")}>المتكررة</button>
        </div>
        {mainTab === "sched" && (
          <div className="ftabs">
            <button type="button" className={`ftab${subFilter === "today" ? " active" : ""}`} onClick={() => setSubFilter("today")}>اليوم</button>
            <button type="button" className={`ftab${subFilter === "upcoming" ? " active" : ""}`} onClick={() => setSubFilter("upcoming")}>قادمة</button>
            <button type="button" className={`ftab${subFilter === "overdue" ? " active" : ""}`} onClick={() => setSubFilter("overdue")}>متأخرة</button>
            <button type="button" className={`ftab${subFilter === "done" ? " active" : ""}`} onClick={() => setSubFilter("done")}>مكتملة</button>
            <button type="button" className={`ftab${subFilter === "archived" ? " active" : ""}`} onClick={() => setSubFilter("archived")}>الأرشيف</button>
            <button type="button" className={`ftab${subFilter === "all" ? " active" : ""}`} onClick={() => setSubFilter("all")}>الكل</button>
          </div>
        )}
        <div className="sp" />
        <input className="sinp" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." />
      </div>

      {mainTab === "sched" && (
        <div className="twrap">
          <table>
            <colgroup><col style={{ width: 34 }} /><col style={{ width: 78 }} /><col style={{ width: 62 }} /><col style={{ width: 90 }} /><col /><col style={{ width: 110 }} /></colgroup>
            <thead><tr><th></th><th>التاريخ</th><th>اليوم</th><th>الوقت</th><th>المهمة</th><th></th></tr></thead>
            <tbody>
              {schedList.length === 0 && <tr className="emptyrow"><td colSpan={6}>لا توجد مهام</td></tr>}
              {schedList.map((task) => {
                const status = getStatus(task);
                const time = task.from ? fmtTime(task.from) + (task.to ? ` - ${fmtTime(task.to)}` : "") : "";
                const rowClass = task.archived ? "r-archived" : task.done ? "r-done" : status === "overdue" ? "r-ov" : status === "today" ? "r-today" : "";
                return (
                  <tr className={`${rowClass} rh`} key={task.id}>
                    <td><button type="button" className={`achk${task.done ? " on" : ""}`} onClick={() => toggleDone(task)} aria-label={`إكمال ${task.name}`} /></td>
                    <td>{fmtDate(task.date)}</td>
                    <td>{fmtDay(task.date)}</td>
                    <td dir="ltr">{time}</td>
                    <td className="td-name">
                      <span className="tn">{task.name}</span>{" "}
                      {task.archived ? (
                        <span className="spill s-ar"><span className="sdot" />مؤرشف</span>
                      ) : status === "overdue" ? (
                        <span className="spill s-ov"><span className="sdot" />{dlStr(daysLate(task.date))}</span>
                      ) : status === "done" ? (
                        <span className="spill s-dn"><span className="sdot" />مكتمل</span>
                      ) : status === "today" ? (
                        <span className="spill s-td"><span className="sdot" />اليوم</span>
                      ) : (
                        <span className="spill s-up"><span className="sdot" />{dueLabel(task.date).txt}</span>
                      )}
                    </td>
                    <td className="td-acts">
                      <button className="abtn" type="button" onClick={() => openEdit(task)}>تعديل</button>
                      {task.archived ? (
                        <button className="abtn archive" type="button" onClick={() => setArchived(task, false)}>استعادة</button>
                      ) : task.done ? (
                        <button className="abtn archive" type="button" onClick={() => setArchived(task, true)}>أرشفة</button>
                      ) : null}
                      <button className="abtn del" type="button" onClick={() => removeTask(task)}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {mainTab === "backlog" && (
        <div className="bl-list">
          {backlogList.length === 0 && <div style={{ textAlign: "center", padding: 28, fontSize: 12, color: "#777772" }}>لا توجد مهام بدون تاريخ</div>}
          {backlogList.map((task) => (
            <div className={`bl-item${task.done ? " done" : ""}`} key={task.id}>
              <button type="button" className={`achk${task.done ? " on" : ""}`} onClick={() => toggleDone(task)} aria-label={`إكمال ${task.name}`} />
              <span className="bl-name">{task.name}</span>
              <div>
                <button className="abtn" type="button" onClick={() => openEdit(task)}>تعديل</button>
                {task.done && <button className="abtn archive" type="button" onClick={() => setArchived(task, true)}>أرشفة</button>}
                <button className="abtn del" type="button" onClick={() => removeTask(task)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mainTab === "rec" && <RecurringSection userId={userId} />}

      {editingTask && (
        <div className="moverlay" onClick={(event) => { if (event.target === event.currentTarget) closeEdit(); }}>
          <div className="gmodal">
            <div className="mtitle"><span>تعديل المهمة</span><button type="button" className="mclose" onClick={closeEdit} aria-label="إغلاق">×</button></div>
            <form onSubmit={saveEdit}>
              <div className="mrow"><span className="mlbl">المهمة *</span><input className="minp" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div className="mrow"><span className="mlbl">التاريخ (اختياري)</span><input className="minp" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                <div className="mrow"><span className="mlbl">من</span><TimePicker value={editForm.from} onChange={(v) => setEditForm((f) => ({ ...f, from: v }))} /></div>
                <div className="mrow"><span className="mlbl">إلى</span><TimePicker value={editForm.to} onChange={(v) => setEditForm((f) => ({ ...f, to: v }))} /></div>
              </div>
              <div className="ach-opt">
                <input type="checkbox" id="et-ach" checked={editForm.achieve} onChange={(e) => setEditForm((f) => ({ ...f, achieve: e.target.checked }))} />
                <label htmlFor="et-ach">أضف للإنجازات تلقائياً عند الإكمال</label>
              </div>
              {actionError && <p className="task-status late" style={{ marginTop: 10 }} role="alert">{actionError}</p>}
              <div className="mfooter">
                <button type="button" className="mbtn cancel" onClick={closeEdit}>إلغاء</button>
                <button type="submit" className="mbtn ok" disabled={editSaving}>{editSaving ? "جارٍ الحفظ..." : "حفظ"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
