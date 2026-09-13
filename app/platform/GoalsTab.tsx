"use client";

import { useEffect, useState } from "react";
import { createUserClient } from "@/lib/supabase/userClient";
import { listGoals, insertGoal, updateGoal, deleteGoal, type CloudGoal } from "@/lib/tasks/cloudStore";

// نفس تصنيفات وألوان تبويب الأهداف في public/munjez-platform.html
const GOAL_CATEGORIES = ["ترفيه", "رياضة", "تعليم", "صحة", "عمل", "شخصي", "أخرى"];
const GOAL_CAT_CLASS: Record<string, string> = {
  "ترفيه": "gc-fun",
  "رياضة": "gc-sport",
  "تعليم": "gc-edu",
  "صحة": "gc-health",
  "عمل": "gc-work",
  "شخصي": "gc-per",
};

const emptyGoalForm = { id: null as string | null, name: "", cat: GOAL_CATEGORIES[0], note: "", imp: false, ach: false };

export default function GoalsTab({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<CloudGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [filterTab, setFilterTab] = useState<"all" | "done">("all");
  const [filterCat, setFilterCat] = useState("all");

  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const supabase = createUserClient();
        const cloudGoals = await listGoals(supabase, userId);
        if (!cancelled) setGoals(cloudGoals);
      } catch {
        if (!cancelled) setLoadError("تعذّر تحميل الأهداف من الخادم. تحقق من اتصالك وأعد تحميل الصفحة.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filteredGoals = goals
    .filter((goal) => filterTab !== "done" || goal.done)
    .filter((goal) => filterCat === "all" || goal.cat === filterCat);

  function openAddModal() {
    setActionError("");
    setGoalForm(emptyGoalForm);
    setModalOpen(true);
  }

  function openEditModal(goal: CloudGoal) {
    setActionError("");
    setGoalForm({ id: goal.id, name: goal.name, cat: goal.cat, note: goal.note ?? "", imp: goal.imp, ach: goal.ach });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setGoalForm(emptyGoalForm);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    const name = goalForm.name.trim();
    if (!name) return;
    const payload = { name, cat: goalForm.cat, note: goalForm.note.trim() || null, imp: goalForm.imp, ach: goalForm.ach };
    setSaving(true);
    setActionError("");
    try {
      const supabase = createUserClient();
      if (goalForm.id) {
        await updateGoal(supabase, goalForm.id, payload);
        setGoals((current) => current.map((g) => (g.id === goalForm.id ? { ...g, ...payload } : g)));
      } else {
        const inserted = await insertGoal(supabase, userId, { ...payload, done: false });
        setGoals((current) => [inserted, ...current]);
      }
      closeModal();
    } catch {
      setActionError(goalForm.id ? "تعذّر حفظ تعديل الهدف." : "تعذّر إضافة الهدف.");
    } finally {
      setSaving(false);
    }
  }

  function toggleDone(goal: CloudGoal) {
    const done = !goal.done;
    setGoals((current) => current.map((g) => (g.id === goal.id ? { ...g, done } : g)));
    setActionError("");
    updateGoal(createUserClient(), goal.id, { done }).catch(() => setActionError("تعذّر حفظ حالة الهدف."));
  }

  function removeGoal(goal: CloudGoal) {
    setGoals((current) => current.filter((g) => g.id !== goal.id));
    setActionError("");
    deleteGoal(createUserClient(), goal.id).catch(() => setActionError("تعذّر حذف الهدف."));
  }

  if (loading) {
    return <p style={{ padding: "20px" }}>جارٍ تحميل الأهداف...</p>;
  }

  if (loadError) {
    return <p className="task-status late" role="alert">{loadError}</p>;
  }

  return (
    <div>
      {actionError && !modalOpen && <p className="task-status late" role="alert" style={{ marginBottom: 10 }}>{actionError}</p>}

      <div className="goals-toolbar">
        <div className="ftabs">
          <button type="button" className={`ftab${filterTab === "all" ? " active" : ""}`} onClick={() => setFilterTab("all")}>الكل</button>
          <button type="button" className={`ftab${filterTab === "done" ? " active" : ""}`} onClick={() => setFilterTab("done")}>مكتمل</button>
        </div>
        <div className="cf-wrap">
          <button type="button" className={`cf${filterCat === "all" ? " on" : ""}`} onClick={() => setFilterCat("all")}>الكل</button>
          {GOAL_CATEGORIES.map((cat) => (
            <button type="button" key={cat} className={`cf${filterCat === cat ? " on" : ""}`} onClick={() => setFilterCat(cat)}>{cat}</button>
          ))}
        </div>
        <div className="sp" />
        <button type="button" className="badd-ah" onClick={openAddModal}><span style={{ fontSize: 13 }}>+</span> هدف جديد</button>
      </div>

      <div className="goals-cloud-list">
        {filteredGoals.length === 0 && <div className="goals-empty">لا توجد أهداف في هذا القسم</div>}
        {filteredGoals.map((goal) => (
          <div className={`gcard${goal.done ? " done-g" : ""}`} key={goal.id}>
            <button
              type="button"
              className={`g-check${goal.done ? " on" : ""}`}
              onClick={() => toggleDone(goal)}
              aria-label={`إكمال هدف ${goal.name}`}
            />
            <div className="g-body">
              <div className="g-name">{goal.name}</div>
              <div className="g-badges">
                <span className={`g-cat ${GOAL_CAT_CLASS[goal.cat] ?? "gc-other"}`}>{goal.cat}</span>
                {goal.imp && <span className="g-imp">مهم</span>}
                {goal.ach && <span className="g-ach-badge">ينتقل للإنجازات</span>}
              </div>
              {goal.note && <div className="g-notes">{goal.note}</div>}
            </div>
            <div className="g-acts">
              <button type="button" className="gact" onClick={() => openEditModal(goal)}>تعديل</button>
              <button type="button" className="gact del" onClick={() => removeGoal(goal)} aria-label={`حذف ${goal.name}`}>×</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="moverlay" onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="gmodal">
            <div className="mtitle">
              <span>{goalForm.id ? "تعديل الهدف" : "هدف جديد"}</span>
              <button type="button" className="mclose" onClick={closeModal} aria-label="إغلاق">×</button>
            </div>
            <form onSubmit={submitForm}>
              <div className="mrow">
                <span className="mlbl">الهدف *</span>
                <input className="minp" value={goalForm.name} onChange={(event) => setGoalForm((f) => ({ ...f, name: event.target.value }))} placeholder="مثال: إنهاء فصل من كتاب..." required />
              </div>
              <div className="mrow">
                <span className="mlbl">الفئة</span>
                <div className="gcp">
                  {GOAL_CATEGORIES.map((cat) => (
                    <div key={cat} className={`gcpo${goalForm.cat === cat ? " sel" : ""}`} onClick={() => setGoalForm((f) => ({ ...f, cat }))}>{cat}</div>
                  ))}
                </div>
              </div>
              <div className="mrow">
                <span className="mlbl">الأهمية</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <div className={`gcpo${goalForm.imp ? " sel" : ""}`} onClick={() => setGoalForm((f) => ({ ...f, imp: true }))}>مهم</div>
                  <div className={`gcpo${!goalForm.imp ? " sel" : ""}`} onClick={() => setGoalForm((f) => ({ ...f, imp: false }))}>غير مهم</div>
                </div>
              </div>
              <div className="mrow">
                <span className="mlbl">ملاحظات (اختياري)</span>
                <textarea className="minp" rows={2} style={{ resize: "none" }} value={goalForm.note} onChange={(event) => setGoalForm((f) => ({ ...f, note: event.target.value }))} />
              </div>
              <div className="ach-opt">
                <input type="checkbox" id="pf-gm-ach" checked={goalForm.ach} onChange={(event) => setGoalForm((f) => ({ ...f, ach: event.target.checked }))} />
                <label htmlFor="pf-gm-ach">يُحتسب كإنجاز عند إتمامه</label>
              </div>
              {actionError && <p className="task-status late" style={{ marginTop: 10 }} role="alert">{actionError}</p>}
              <div className="mfooter">
                <button type="button" className="mbtn cancel" onClick={closeModal}>إلغاء</button>
                <button type="submit" className="mbtn ok" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
