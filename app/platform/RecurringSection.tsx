"use client";

import { useEffect, useState } from "react";
import { createUserClient } from "@/lib/supabase/userClient";
import { listRecurring, insertRecurring, updateRecurring, deleteRecurring, type CloudRecurring } from "@/lib/tasks/cloudStore";
import TimePicker from "./TimePicker";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_S = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

function fmtTime(time: string) {
  if (!time) return "";
  const [hh, mm] = time.split(":");
  const n = Number(hh);
  const h12 = n % 12 || 12;
  return `${h12}:${mm}${n < 12 ? " AM" : " PM"}`;
}

type RecForm = {
  id: string | null;
  name: string;
  freq: "daily" | "weekly";
  weekday: number | null;
  from: string;
  achieve: boolean;
};

const emptyForm: RecForm = { id: null, name: "", freq: "daily", weekday: null, from: "", achieve: false };

export default function RecurringSection({ userId }: { userId: string }) {
  const [items, setItems] = useState<CloudRecurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<RecForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const supabase = createUserClient();
        const cloudItems = await listRecurring(supabase, userId);
        if (!cancelled) setItems(cloudItems);
      } catch {
        if (!cancelled) setLoadError("تعذّر تحميل المهام المتكررة من الخادم. تحقق من اتصالك وأعد تحميل الصفحة.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function openAdd() {
    setActionError("");
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(rec: CloudRecurring) {
    setActionError("");
    setForm({
      id: rec.id,
      name: rec.name,
      freq: rec.freq === "weekly" ? "weekly" : "daily",
      weekday: rec.weekday,
      from: rec.from,
      achieve: rec.achieve,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    setActionError("");
    const payload = {
      name,
      freq: form.freq,
      weekday: form.freq === "weekly" ? form.weekday : null,
      from: form.from,
      achieve: form.achieve,
    };
    try {
      const supabase = createUserClient();
      if (form.id) {
        await updateRecurring(supabase, form.id, payload);
        setItems((current) => current.map((r) => (r.id === form.id ? { ...r, ...payload } : r)));
      } else {
        const inserted = await insertRecurring(supabase, userId, { ...payload, active: true, done: false });
        setItems((current) => [inserted, ...current]);
      }
      closeModal();
    } catch {
      setActionError(form.id ? "تعذّر حفظ تعديل المهمة المتكررة." : "تعذّر إضافة المهمة المتكررة.");
    } finally {
      setSaving(false);
    }
  }

  function toggleActive(rec: CloudRecurring) {
    const nextActive = !rec.active;
    setItems((current) => current.map((r) => (r.id === rec.id ? { ...r, active: nextActive } : r)));
    setActionError("");
    updateRecurring(createUserClient(), rec.id, { active: nextActive }).catch(() => {
      setItems((current) => current.map((r) => (r.id === rec.id ? { ...r, active: rec.active } : r)));
      setActionError("تعذّر تحديث حالة المهمة المتكررة.");
    });
  }

  function removeRec(rec: CloudRecurring) {
    setItems((current) => current.filter((r) => r.id !== rec.id));
    setActionError("");
    deleteRecurring(createUserClient(), rec.id).catch(() => setActionError("تعذّر حذف المهمة المتكررة."));
  }

  if (loading) {
    return <p style={{ padding: "20px" }}>جارٍ تحميل المهام المتكررة...</p>;
  }

  if (loadError) {
    return <p className="task-status late" role="alert">{loadError}</p>;
  }

  return (
    <div>
      {actionError && <p className="task-status late" role="alert" style={{ marginBottom: 10 }}>{actionError}</p>}

      <div style={{ marginBottom: 10 }}>
        <button type="button" className="badd" onClick={openAdd}>+ مهمة متكررة</button>
      </div>

      <div className="rec-list">
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: 28, fontSize: 12, color: "var(--txt3)" }}>أضف مهمتك المتكررة الأولى</div>
        )}
        {items.map((rec) => (
          <div className="rec-item" key={rec.id}>
            <div className="rec-info">
              <div className="rec-name">{rec.name}</div>
              <div className="rec-meta">
                <span className="rec-badge">{rec.freq === "daily" ? "يومي" : `أسبوعي — ${rec.weekday !== null ? DAYS[rec.weekday] : ""}`}</span>
                {rec.from ? ` · ${fmtTime(rec.from)}` : ""}
              </div>
            </div>
            <div className="rec-acts">
              <button type="button" className={`tog-btn${rec.active ? " on" : ""}`} onClick={() => toggleActive(rec)}>{rec.active ? "نشط" : "متوقف"}</button>
              <button type="button" className="abtn" onClick={() => openEdit(rec)}>تعديل</button>
              <button type="button" className="abtn del" onClick={() => removeRec(rec)}>×</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="moverlay" onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="gmodal">
            <div className="mtitle">
              <span>{form.id ? "تعديل المهمة المتكررة" : "مهمة متكررة جديدة"}</span>
              <button type="button" className="mclose" onClick={closeModal} aria-label="إغلاق">×</button>
            </div>
            <form onSubmit={submitForm}>
              <div className="mrow">
                <span className="mlbl">اسم المهمة *</span>
                <input className="minp" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="مثال: أشواغندا، فيتامين د..." required />
              </div>
              <div className="mrow">
                <span className="mlbl">التكرار</span>
                <div className="gcp">
                  <div className={`gcpo${form.freq === "daily" ? " sel" : ""}`} onClick={() => setForm((f) => ({ ...f, freq: "daily" }))}>يومي</div>
                  <div className={`gcpo${form.freq === "weekly" ? " sel" : ""}`} onClick={() => setForm((f) => ({ ...f, freq: "weekly" }))}>أسبوعي</div>
                </div>
              </div>
              {form.freq === "weekly" && (
                <div className="mrow">
                  <span className="mlbl">يوم الأسبوع</span>
                  <div className="gcp">
                    {DAYS_S.map((label, i) => (
                      <div key={label} className={`gcpo${form.weekday === i ? " sel" : ""}`} onClick={() => setForm((f) => ({ ...f, weekday: i }))}>{label}</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mrow">
                <span className="mlbl">الوقت (اختياري)</span>
                <TimePicker value={form.from} onChange={(v) => setForm((f) => ({ ...f, from: v }))} />
              </div>
              <div className="ach-opt">
                <input type="checkbox" id="rm-ach" checked={form.achieve} onChange={(e) => setForm((f) => ({ ...f, achieve: e.target.checked }))} />
                <label htmlFor="rm-ach">أضف للإنجازات عند الإكمال</label>
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
