"use client";

import { useEffect, useState } from "react";
import { createUserClient } from "@/lib/supabase/userClient";
import {
  listAchievements,
  insertAchievement,
  updateAchievement,
  deleteAchievement,
  type CloudAchievement,
} from "@/lib/tasks/cloudStore";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const CATEGORIES = ["مهني", "شخصي", "تعليمي", "عمل", "رياضي"];
const CAT_BADGE: Record<string, string> = {
  "مهني": "b-pro",
  "شخصي": "b-per",
  "تعليمي": "b-edu",
  "عمل": "b-wrk",
  "رياضي": "b-spt",
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function catInit(cat: string) {
  return (cat || "م").charAt(0);
}

type TabRange = "day" | "month" | "year";

const emptyForm = { id: null as string | null, name: "", date: todayKey(), cat: CATEGORIES[0], note: "", feat: false };

export default function AchievementsTab({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<CloudAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [rangeTab, setRangeTab] = useState<TabRange>("day");
  const [catFilter, setCatFilter] = useState("all");

  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const supabase = createUserClient();
        const cloudAchievements = await listAchievements(supabase, userId);
        if (!cancelled) setAchievements(cloudAchievements);
      } catch {
        if (!cancelled) setLoadError("تعذّر تحميل الإنجازات من الخادم. تحقق من اتصالك وأعد تحميل الصفحة.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const today = todayKey();
  const monthKey = today.slice(0, 7);

  const byRange =
    rangeTab === "day"
      ? achievements.filter((a) => a.date === today)
      : rangeTab === "month"
        ? achievements.filter((a) => a.date.startsWith(monthKey))
        : achievements;

  const filtered = catFilter === "all" ? byRange : byRange.filter((a) => a.cat === catFilter);

  function openAddModal() {
    setActionError("");
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(achievement: CloudAchievement) {
    setActionError("");
    setForm({
      id: achievement.id,
      name: achievement.name,
      date: achievement.date,
      cat: achievement.cat,
      note: achievement.note ?? "",
      feat: achievement.feat,
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
    const payload = {
      name,
      date: form.date || todayKey(),
      cat: form.cat,
      note: form.note.trim() || null,
      feat: form.feat,
    };
    setSaving(true);
    setActionError("");
    try {
      const supabase = createUserClient();
      if (form.id) {
        await updateAchievement(supabase, form.id, payload);
        setAchievements((current) => current.map((a) => (a.id === form.id ? { ...a, ...payload } : a)));
      } else {
        const inserted = await insertAchievement(supabase, userId, { ...payload, imgs: [], files: [] });
        setAchievements((current) => [inserted, ...current]);
      }
      closeModal();
    } catch {
      setActionError(form.id ? "تعذّر حفظ تعديل الإنجاز." : "تعذّر إضافة الإنجاز.");
    } finally {
      setSaving(false);
    }
  }

  function toggleFeat(achievement: CloudAchievement) {
    const feat = !achievement.feat;
    setAchievements((current) => current.map((a) => (a.id === achievement.id ? { ...a, feat } : a)));
    setActionError("");
    updateAchievement(createUserClient(), achievement.id, { feat }).catch(() => setActionError("تعذّر تحديث تمييز الإنجاز."));
  }

  function removeAchievement(achievement: CloudAchievement) {
    setAchievements((current) => current.filter((a) => a.id !== achievement.id));
    setActionError("");
    deleteAchievement(createUserClient(), achievement.id).catch(() => setActionError("تعذّر حذف الإنجاز."));
  }

  if (loading) {
    return <p style={{ padding: "20px" }}>جارٍ تحميل الإنجازات...</p>;
  }

  if (loadError) {
    return <p className="task-status late" role="alert">{loadError}</p>;
  }

  return (
    <div>
      {actionError && !modalOpen && <p className="task-status late" role="alert" style={{ marginBottom: 10 }}>{actionError}</p>}

      <div className="ah-row">
        <div className="ftabs">
          <button type="button" className={`ftab${rangeTab === "day" ? " active" : ""}`} onClick={() => setRangeTab("day")}>اليوم</button>
          <button type="button" className={`ftab${rangeTab === "month" ? " active" : ""}`} onClick={() => setRangeTab("month")}>الشهر</button>
          <button type="button" className={`ftab${rangeTab === "year" ? " active" : ""}`} onClick={() => setRangeTab("year")}>السنة</button>
        </div>
        <div className="cf-wrap">
          <button type="button" className={`cf${catFilter === "all" ? " on" : ""}`} onClick={() => setCatFilter("all")}>الكل</button>
          {CATEGORIES.map((cat) => (
            <button type="button" key={cat} className={`cf${catFilter === cat ? " on" : ""}`} onClick={() => setCatFilter(cat)}>{cat}</button>
          ))}
        </div>
        <div className="sp" />
        <button type="button" className="badd-ah" onClick={openAddModal}><span style={{ fontSize: 13 }}>+</span> إنجاز جديد</button>
      </div>

      <div className="goals-cloud-list">
        {filtered.length === 0 && <div className="goals-empty">لا توجد إنجازات في هذا القسم</div>}
        {filtered.map((achievement) => (
          <div className={`ahcard${achievement.feat ? " feat" : ""}`} key={achievement.id}>
            <div className="ahcard-head">
              <div className="ahcard-icon">{catInit(achievement.cat)}</div>
              <div className="ahcard-info">
                <div className="ahcard-name">{achievement.name}</div>
                <div className="ahcard-meta">{fmtDate(achievement.date)}{achievement.date === today ? " · اليوم" : ""}</div>
              </div>
            </div>
            <div className="ahcard-body">
              {achievement.note && <div className="ahcard-note-d">{achievement.note}</div>}
              <div className="ahcard-badges">
                <span className={`badge ${CAT_BADGE[achievement.cat] ?? "b-pro"}`}>{achievement.cat}</span>
                {achievement.feat && <span className="badge b-feat">بارز</span>}
              </div>
              <div className="ahcard-acts">
                <button type="button" className="ahact" onClick={() => openEditModal(achievement)}>تعديل</button>
                <button type="button" className={`ahact${achievement.feat ? " feat-on" : ""}`} onClick={() => toggleFeat(achievement)}>
                  {achievement.feat ? "إلغاء التمييز" : "تمييز بارز"}
                </button>
                <button type="button" className="ahact del" onClick={() => removeAchievement(achievement)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="moverlay" onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="gmodal">
            <div className="mtitle">
              <span>{form.id ? "تعديل الإنجاز" : "إنجاز جديد"}</span>
              <button type="button" className="mclose" onClick={closeModal} aria-label="إغلاق">×</button>
            </div>
            <form onSubmit={submitForm}>
              <div className="mrow">
                <span className="mlbl">الاسم *</span>
                <input className="minp" value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} placeholder="اسم الإنجاز..." required />
              </div>
              <div className="mrow">
                <span className="mlbl">التاريخ</span>
                <input className="minp" type="date" value={form.date} onChange={(event) => setForm((f) => ({ ...f, date: event.target.value }))} />
              </div>
              <div className="mrow">
                <span className="mlbl">الفئة</span>
                <div className="gcp">
                  {CATEGORIES.map((cat) => (
                    <div key={cat} className={`gcpo${form.cat === cat ? " sel" : ""}`} onClick={() => setForm((f) => ({ ...f, cat }))}>{cat}</div>
                  ))}
                </div>
              </div>
              <div className="mrow">
                <span className="mlbl">ملاحظة (اختياري)</span>
                <textarea className="minp" rows={2} style={{ resize: "none" }} value={form.note} onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))} />
              </div>
              <div className="ach-opt">
                <input type="checkbox" id="pf-am-feat" checked={form.feat} onChange={(event) => setForm((f) => ({ ...f, feat: event.target.checked }))} />
                <label htmlFor="pf-am-feat">تمييز كإنجاز بارز</label>
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
