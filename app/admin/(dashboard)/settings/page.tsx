"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FieldConfig = { key: string; label: string; textarea?: boolean };
type GroupConfig = { title: string; fields: FieldConfig[] };

const GROUPS: GroupConfig[] = [
  {
    title: "اسم ووصف الموقع",
    fields: [
      { key: "site_name", label: "اسم الموقع" },
      { key: "site_description", label: "الوصف التعريفي", textarea: true },
    ],
  },
  {
    title: "عناوين البريد الإلكتروني",
    fields: [
      { key: "contact_email_hello", label: "بريد التعاون والشراكات" },
      { key: "contact_email_info", label: "بريد المعلومات والإعلام" },
      { key: "contact_email_support", label: "بريد الدعم" },
    ],
  },
  {
    title: "روابط التواصل الاجتماعي",
    fields: [
      { key: "social_x", label: "X (تويتر)" },
      { key: "social_instagram", label: "Instagram" },
      { key: "social_linkedin", label: "LinkedIn" },
      { key: "social_tiktok", label: "TikTok" },
    ],
  },
  {
    title: "صفحة عن المشروع",
    fields: [
      { key: "about_heading_1", label: "عنوان القسم الأول" },
      { key: "about_paragraph_1", label: "فقرة القسم الأول", textarea: true },
      { key: "about_heading_2", label: "عنوان القسم الثاني" },
      { key: "about_paragraph_2", label: "فقرة القسم الثاني", textarea: true },
    ],
  },
];

const ALL_KEYS = GROUPS.flatMap((group) => group.fields.map((field) => field.key));

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ALL_KEYS)
      .then(({ data, error }) => {
        if (error) {
          setError("تعذّر تحميل الإعدادات.");
          setLoading(false);
          return;
        }
        const map: Record<string, string> = {};
        for (const row of data ?? []) {
          map[row.key as string] = (row.value as string) ?? "";
        }
        setValues(map);
        setLoading(false);
      });
  }, []);

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const supabase = createClient();
    const rows = ALL_KEYS.map((key) => ({ key, value: values[key] ?? "" }));

    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });

    setSaving(false);

    if (error) {
      setError("تعذّر حفظ الإعدادات، حاول مرة أخرى.");
      return;
    }

    setSaved(true);
  }

  if (loading) {
    return <p className="p-10 text-center text-muted-foreground">جارٍ التحميل...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-semibold text-foreground">الإعدادات العامة</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        {GROUPS.map((group) => (
          <div key={group.title} className="border border-border bg-card p-8 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-foreground">{group.title}</h2>
            <div className="flex flex-col gap-5">
              {group.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label htmlFor={field.key} className="text-sm text-foreground">
                    {field.label}
                  </label>
                  {field.textarea ? (
                    <textarea
                      id={field.key}
                      rows={4}
                      value={values[field.key] ?? ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="resize-y border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
                    />
                  ) : (
                    <input
                      id={field.key}
                      type="text"
                      value={values[field.key] ?? ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="text-sm text-foreground" role="status">
            تم الحفظ بنجاح.
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary px-5 py-2.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
