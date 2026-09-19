"use client";

import { useEffect, useMemo, useState } from "react";
import { createUserClient } from "@/lib/supabase/userClient";
import {
  listTasks,
  insertTask,
  updateTask,
  listRecurring,
  listRecurringCompletions,
  markRecurringDone,
  unmarkRecurringDone,
  type CloudTask,
  type CloudRecurring,
  type CloudRecurringCompletion,
} from "@/lib/tasks/cloudStore";

const DAYS_S = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTH_HEADS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

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

type Status = "today" | "overdue" | "done" | "upcoming";

function getStatus(task: CloudTask): Status {
  if (task.done) return "done";
  const d = new Date(`${task.date}T12:00:00`);
  d.setHours(0, 0, 0, 0);
  const today = startOfToday();
  if (d.getTime() < today.getTime()) return "overdue";
  if (d.getTime() === today.getTime()) return "today";
  return "upcoming";
}

const STATUS_CLASS: Record<Status, string> = {
  today: "s-td",
  upcoming: "s-up",
  done: "s-dn",
  overdue: "s-ov",
};

function fmtTime(time: string) {
  if (!time) return "";
  const [hh, mm] = time.split(":");
  const n = Number(hh);
  const h12 = n % 12 || 12;
  return `${h12}:${mm}${n < 12 ? " AM" : " PM"}`;
}

function isRecurringDue(rec: CloudRecurring, dateKey: string, dateObj: Date): boolean {
  if (!rec.active) return false;
  const createdKey = toKey(new Date(rec.createdAt));
  if (dateKey < createdKey) return false;
  if (rec.freq === "daily") return true;
  return rec.freq === "weekly" && rec.weekday === dateObj.getDay();
}

type DisplayItem =
  | { kind: "task"; id: string; from: string; name: string; statusClass: string; done: boolean }
  | { kind: "recurring"; id: string; from: string; name: string; done: boolean; recId: string; dateKey: string };

type CalView = "week" | "month";

export default function CalendarTab({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<CloudTask[]>([]);
  const [recurring, setRecurring] = useState<CloudRecurring[]>([]);
  const [completions, setCompletions] = useState<CloudRecurringCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [addError, setAddError] = useState("");
  const [actionError, setActionError] = useState("");

  const [view, setView] = useState<CalView>("week");
  const [calDate, setCalDate] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const supabase = createUserClient();
        const [cloudTasks, cloudRecurring, cloudCompletions] = await Promise.all([
          listTasks(supabase, userId),
          listRecurring(supabase, userId),
          listRecurringCompletions(supabase, userId),
        ]);
        if (!cancelled) {
          setTasks(cloudTasks);
          setRecurring(cloudRecurring);
          setCompletions(cloudCompletions);
        }
      } catch {
        if (!cancelled) setLoadError("تعذّر تحميل مهام التقويم من الخادم. تحقق من اتصالك وأعد تحميل الصفحة.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  const completionsSet = useMemo(
    () => new Set(completions.map((c) => `${c.recurringId}|${c.date}`)),
    [completions]
  );

  function buildDayItems(dateKey: string, dateObj: Date): DisplayItem[] {
    const real: DisplayItem[] = (tasksByDate.get(dateKey) ?? []).map((t) => ({
      kind: "task",
      id: t.id,
      from: t.from,
      name: t.name,
      statusClass: STATUS_CLASS[getStatus(t)],
      done: t.done,
    }));
    const recItems: DisplayItem[] = recurring
      .filter((r) => isRecurringDue(r, dateKey, dateObj))
      .map((r) => ({
        kind: "recurring",
        id: `rec-${r.id}-${dateKey}`,
        from: r.from,
        name: r.name,
        done: completionsSet.has(`${r.id}|${dateKey}`),
        recId: r.id,
        dateKey,
      }));
    return [...real, ...recItems].sort((a, b) => (a.from || "").localeCompare(b.from || ""));
  }

  function toggleTaskDone(taskId: string, currentDone: boolean) {
    const next = !currentDone;
    setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, done: next } : t)));
    setActionError("");
    updateTask(createUserClient(), taskId, { done: next }).catch(() => {
      setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, done: currentDone } : t)));
      setActionError("تعذّر تحديث حالة المهمة.");
    });
  }

  function toggleRecurringDone(recId: string, dateKey: string, currentlyDone: boolean) {
    setActionError("");
    const supabase = createUserClient();
    if (currentlyDone) {
      setCompletions((cur) => cur.filter((c) => !(c.recurringId === recId && c.date === dateKey)));
      unmarkRecurringDone(supabase, recId, dateKey).catch(() => {
        setCompletions((cur) => [...cur, { id: `revert-${recId}-${dateKey}`, recurringId: recId, date: dateKey }]);
        setActionError("تعذّر تحديث حالة المهمة المتكررة.");
      });
    } else {
      const tempId = `temp-${recId}-${dateKey}`;
      setCompletions((cur) => [...cur, { id: tempId, recurringId: recId, date: dateKey }]);
      markRecurringDone(supabase, userId, recId, dateKey)
        .then((inserted) => {
          setCompletions((cur) => cur.map((c) => (c.id === tempId ? inserted : c)));
        })
        .catch(() => {
          setCompletions((cur) => cur.filter((c) => c.id !== tempId));
          setActionError("تعذّر تحديث حالة المهمة المتكررة.");
        });
    }
  }

  async function quickAdd(dateKey: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAddError("");
    try {
      const supabase = createUserClient();
      const newTask = await insertTask(supabase, userId, {
        name: trimmed,
        date: dateKey,
        from: "",
        to: "",
        achieve: false,
        done: false,
        archived: false,
      });
      setTasks((prev) => [...prev, newTask]);
    } catch {
      setAddError("تعذّر إضافة المهمة. تحقق من اتصالك وحاول مرة أخرى.");
    }
  }

  function navigate(dir: 1 | -1) {
    if (view === "week") {
      setCalDate((prev) => new Date(prev.getTime() + dir * 7 * 86400000));
    } else {
      setCalDate((prev) => {
        const d = new Date(prev);
        d.setDate(1);
        d.setMonth(d.getMonth() + dir);
        return d;
      });
    }
  }

  const todayKey = toKey(startOfToday());

  let title = "";
  if (view === "week") {
    const ws = getWeekStart(calDate);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    title = `${ws.getDate()} ${MONTHS[ws.getMonth()]} – ${we.getDate()} ${MONTHS[we.getMonth()]} ${we.getFullYear()}`;
  } else {
    title = `${MONTHS[calDate.getMonth()]} ${calDate.getFullYear()}`;
  }

  const weekCols = useMemo(() => {
    const ws = getWeekStart(calDate);
    const cols: { key: string; date: Date; isToday: boolean; items: DisplayItem[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      const k = toKey(d);
      cols.push({ key: k, date: d, isToday: k === todayKey, items: buildDayItems(k, d) });
    }
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calDate, tasksByDate, recurring, completionsSet, todayKey]);

  const monthCells = useMemo(() => {
    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const first = new Date(y, m, 1);
    const sd = first.getDay();
    const dim = new Date(y, m + 1, 0).getDate();
    const pd = new Date(y, m, 0).getDate();
    const cells: { date: Date; outside: boolean }[] = [];
    for (let i = sd - 1; i >= 0; i--) cells.push({ date: new Date(y, m - 1, pd - i), outside: true });
    for (let d = 1; d <= dim; d++) cells.push({ date: new Date(y, m, d), outside: false });
    while (cells.length % 7 !== 0) {
      cells.push({ date: new Date(y, m + 1, cells.length - dim - sd + 1), outside: true });
    }
    return cells;
  }, [calDate]);

  return (
    <div>
      <div className="cal-tb">
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <button type="button" className="carrow" style={{ width: "auto", padding: "0 10px" }} onClick={() => navigate(-1)}>السابق</button>
          <span className="cal-ttl">{title}</span>
          <button type="button" className="carrow" style={{ width: "auto", padding: "0 10px" }} onClick={() => navigate(1)}>التالي</button>
        </div>
        <button type="button" className="tbtn" onClick={() => setCalDate(new Date())}>اليوم</button>
        <div className="sp" />
        <div className="vt-wrap">
          <button type="button" className={`vt${view === "week" ? " active" : ""}`} onClick={() => setView("week")}>أسبوعي</button>
          <button type="button" className={`vt${view === "month" ? " active" : ""}`} onClick={() => setView("month")}>شهري</button>
        </div>
      </div>

      {addError && <p className="task-status late" role="alert" style={{ marginBottom: 10 }}>{addError}</p>}
      {actionError && <p className="task-status late" role="alert" style={{ marginBottom: 10 }}>{actionError}</p>}

      {loadError ? (
        <div className="goals-empty">{loadError}</div>
      ) : loading ? (
        <div className="goals-empty">جارٍ تحميل التقويم...</div>
      ) : view === "week" ? (
        <div className="week-grid">
          {weekCols.map((col) => (
            <div key={col.key} className={`wcol${col.isToday ? " tcol" : ""}`}>
              <div className={`whead${col.isToday ? " tcol" : ""}`}>
                <div className="wdn">{DAYS_S[col.date.getDay()]}</div>
                <div className="wdd">{col.date.getDate()}</div>
              </div>
              <div className="wbody">
                {col.items.map((item) =>
                  item.kind === "task" ? (
                    <div key={item.id} className={`wchip ${item.statusClass}`} onClick={() => toggleTaskDone(item.id, item.done)}>
                      <span className="wchip-n">{item.name}</span>
                      {item.from ? <span className="wchip-t">{fmtTime(item.from)}</span> : null}
                    </div>
                  ) : (
                    <div
                      key={item.id}
                      className={`wchip s-rec${item.done ? " rec-done" : ""}`}
                      onClick={() => toggleRecurringDone(item.recId, item.dateKey, item.done)}
                    >
                      <span className="wchip-n">{item.done ? "✓ " : ""}{item.name}</span>
                      {item.from ? <span className="wchip-t">{fmtTime(item.from)}</span> : null}
                    </div>
                  )
                )}
              </div>
              <div className="wadd-area">
                <input
                  className="wadd"
                  placeholder="+ أضف مهمة"
                  onKeyDown={(e) => {
                    const input = e.currentTarget;
                    if (e.key === "Enter" && input.value.trim()) {
                      quickAdd(col.key, input.value);
                      input.value = "";
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="month-wrap">
          <div className="mhead-row">
            {MONTH_HEADS.map((h) => (
              <div key={h} className="mhn">{h}</div>
            ))}
          </div>
          {Array.from({ length: monthCells.length / 7 }).map((_, r) => (
            <div key={r} className="mrow-g">
              {monthCells.slice(r * 7, r * 7 + 7).map((cell, c) => {
                const k = toKey(cell.date);
                const isToday = k === todayKey;
                const items = buildDayItems(k, cell.date);
                const shown = items.slice(0, 3);
                const extra = items.length - shown.length;
                return (
                  <div key={c} className={`mcell${cell.outside ? " om" : ""}${isToday ? " tc" : ""}`}>
                    <div className="mdate">{cell.date.getDate()}</div>
                    {shown.map((item) =>
                      item.kind === "task" ? (
                        <div key={item.id} className={`mt ${item.statusClass}`} onClick={() => toggleTaskDone(item.id, item.done)}>{item.name}</div>
                      ) : (
                        <div
                          key={item.id}
                          className={`mt s-rec${item.done ? " rec-done" : ""}`}
                          onClick={() => toggleRecurringDone(item.recId, item.dateKey, item.done)}
                        >
                          {item.done ? "✓ " : ""}{item.name}
                        </div>
                      )
                    )}
                    {extra > 0 ? <div className="more-m">+{extra}</div> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
