"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "./ImageUpload";

export type FieldConfig = { key: string; label: string; textarea?: boolean; placeholder?: string; image?: boolean };
export type GroupConfig = { title: string; fields: FieldConfig[] };

export default function SiteSettingsForm({ pageTitle, groups }: { pageTitle: string; groups: GroupConfig[] }) {
  const allKeys = groups.flatMap((group) => group.fields.map((field) => field.key));

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
      .in("key", allKeys)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const rows = allKeys.map((key) => ({ key, value: values[key] ?? "" }));

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
      <h1 className="mb-8 text-2xl font-semibold text-foreground">{pageTitle}</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.title} className="border border-border bg-card p-8 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-foreground">{group.title}</h2>
            <div className="flex flex-col gap-5">
              {group.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label htmlFor={field.key} className="text-sm text-foreground">
                    {field.label}
                  </label>
                  {field.image ? (
                    <ImageUpload
                      value={values[field.key] ?? ""}
                      onChange={(url) => setField(field.key, url)}
                    />
                  ) : field.textarea ? (
                    <textarea
                      id={field.key}
                      rows={4}
                      value={values[field.key] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="resize-y border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
                    />
                  ) : (
                    <input
                      id={field.key}
                      type="text"
                      value={values[field.key] ?? ""}
                      placeholder={field.placeholder}
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
