"use client";

// معاينة "طُعم جذب" للزائر غير المسجَّل — هيكل ثابت بالكامل، بلا أي استيراد
// لـ Supabase أو cloudStore أو createUserClient. الأمان هنا بنيوي: يستحيل
// إرسال أي طلب شبكة من هذا الملف لأنه لا يستورد أي عميل أو دالة جلب بيانات.

import Link from "next/link";
import type { CSSProperties } from "react";
import { Archive, ArrowLeft, ArrowUpLeft, CalendarDays, LogIn, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MunjezFooter } from "@/components/site-chrome";

function dateKey() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ar-SA", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));
}

const ctaButtonStyle: CSSProperties = {
  display: "inline-flex",
  minHeight: 48,
  alignItems: "center",
  gap: 10,
  padding: "0 17px",
  border: "1px solid #fff",
  background: "transparent",
  color: "#fff",
  fontWeight: 700,
  fontFamily: "inherit",
  fontSize: "0.85rem",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default function TasksPreview({ onRequestAuth }: { onRequestAuth: () => void }) {
  const today = dateKey();

  return <><main className="task-app" dir="rtl">
    <header className="task-topbar">
      <Link className="task-brand" href="/"><img src="/hourglass-logo.png" alt="شعار رحلة مُنجِز" /><strong>رحـلـة مُـنـجِـز</strong></Link>
      <div className="task-top-actions"><Link className="full-platform-link" href="/platform">فتح منصة مُنجِز الكاملة <ArrowUpLeft size={17} /></Link><Link className="back-to-site" href="/">العودة للموقع <ArrowLeft size={17} /></Link></div>
    </header>

    <div className="task-shell">
      <div className="task-heading"><div><span>لوحتك المختصرة · التسجيل مطلوب لعرض بياناتك</span><h1>إدارة المهام</h1><p>سجّل الدخول أو أنشئ حساباً لتتابع مهامك، أهدافك، وإنجازاتك الحقيقية هنا.</p></div><time>{dateLabel(today)}</time></div>

      <section className="platform-handoff" style={{ marginTop: 0, marginBottom: 28 }}>
        <div>
          <span>ابدأ الآن</span>
          <h2>لوحتك بانتظارك</h2>
          <p>هذه معاينة فارغة لشكل اللوحة. سجّل الدخول أو أنشئ حساباً مجانياً لتبدأ بإضافة مهامك الحقيقية ومتابعة تقدّمك.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={ctaButtonStyle} onClick={onRequestAuth}>تسجيل الدخول <LogIn size={17} /></button>
          <button type="button" style={ctaButtonStyle} onClick={onRequestAuth}>إنشاء حساب <UserPlus size={17} /></button>
        </div>
      </section>

      <section className="task-stats"><article><span>مهام اليوم</span><b>0</b></article><article><span>مكتملة</span><b>0</b></article><article><span>متأخرة</span><b>0</b></article><article><span>إجمالي المهام</span><b>0</b></article></section>

      <Tabs defaultValue="tasks" className="task-tabs" dir="rtl">
        <TabsList variant="line" className="task-tabs-list"><TabsTrigger value="tasks">المهام</TabsTrigger><TabsTrigger value="achievements">الإنجازات</TabsTrigger><TabsTrigger value="goals">الأهداف</TabsTrigger><TabsTrigger value="calendar">التقويم</TabsTrigger></TabsList>

        <TabsContent value="tasks">
          <section className="task-panel">
            <div className="panel-title"><div><h2>مهامك</h2><span>0 مهام</span></div></div>
            <div className="task-list">
              <article aria-hidden="true"><Checkbox checked={false} disabled aria-label="مثال لمهمة" /><div className="task-name"><strong>سجّل الدخول لرؤية مهامك هنا</strong><span>ستظهر مهامك الحقيقية بعد تسجيل الدخول</span></div></article>
            </div>
          </section>
          <section className="archive-panel"><h2><Archive size={18} /> الأرشيف</h2><p>سجّل الدخول لرؤية أرشيف مهامك المكتملة.</p></section>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="goals-empty">سجّل الدخول لرؤية إنجازاتك الحقيقية هنا.</div>
        </TabsContent>

        <TabsContent value="goals">
          <div className="goals-cloud-list">
            <div className="goals-empty">سجّل الدخول لرؤية أهدافك الحقيقية هنا.</div>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <section className="calendar-view">
            <div className="calendar-day is-today"><b>اليوم</b><strong>{dateLabel(today)}</strong></div>
            <div className="calendar-day"><b>غدًا</b></div>
            <div className="calendar-day"><b>قادم</b></div>
            <CalendarDays size={28} />
          </section>
        </TabsContent>
      </Tabs>

      <section className="platform-handoff"><div><span>تحتاج التفاصيل؟</span><h2>كل أدوات مُنجِز في مكان واحد</h2><p>افتح المنصة الكاملة لإدارة المواعيد، المهام المتكررة، سجل الإنجازات، الأهداف والتقويم الأسبوعي والشهري.</p></div><Link href="/platform">الانتقال إلى منصة مُنجِز <ArrowLeft size={18} /></Link></section>
    </div>
  </main><MunjezFooter /></>;
}
