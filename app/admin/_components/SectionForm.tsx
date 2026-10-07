"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SectionConfig } from "../_lib/sections";
import MarkdownContent from "@/app/articles/MarkdownContent";
import { normalizeSpacing } from "@/lib/articleSpacing";
import { deleteStoredAudioIfUnused, isStoredPodcastAudio } from "@/lib/podcastAudio";
import ImageUpload from "./ImageUpload";
import AudioUpload from "./AudioUpload";

type Values = Record<string, string | boolean>;

function buildInitialValues(
  fields: SectionConfig["fields"],
  initialValues?: Record<string, unknown>
): Values {
  const values: Values = {};
  for (const field of fields) {
    const existing = initialValues?.[field.name];
    if (field.type === "checkbox") {
      values[field.name] = Boolean(
        existing ?? (field.defaultChecked ?? false)
      );
    } else if (field.type === "select") {
      values[field.name] = (existing as string) || field.defaultValue;
    } else if (field.type === "number") {
      values[field.name] = existing != null ? String(existing) : "";
    } else {
      values[field.name] = (existing as string) ?? "";
    }
  }
  return values;
}

export default function SectionForm({
  section,
  initialValues,
  recordId,
}: {
  section: SectionConfig;
  initialValues?: Record<string, unknown>;
  recordId?: string;
}) {
  const router = useRouter();
  const isEditing = Boolean(recordId);
  const [values, setValues] = useState<Values>(
    buildInitialValues(section.fields, initialValues)
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const audioField = section.fields.find((f) => f.type === "audio");
  const initialAudioUrl = audioField ? String(initialValues?.[audioField.name] ?? "") : "";
  // ملفات صوتية رُفعت في هذه الجلسة ولم تُحفظ بعد في الحلقة
  const sessionUploadsRef = useRef(new Set<string>());
  const savedRef = useRef(false);

  // مغادرة النموذج دون حفظ (إلغاء أو الانتقال لصفحة أخرى): نحذف ما رُفع ولم يُستخدم
  useEffect(() => {
    const uploads = sessionUploadsRef.current;
    return () => {
      if (savedRef.current || !audioField || uploads.size === 0) return;
      const supabase = createClient();
      for (const url of uploads) {
        deleteStoredAudioIfUnused(supabase, url, section.table, audioField.name);
      }
    };
  }, [section.table, audioField]);

  // إعادة تحميل الصفحة أو إغلاقها أثناء الرفع أو قبل حفظ ملف مرفوع
  useEffect(() => {
    function warnBeforeUnload(e: BeforeUnloadEvent) {
      if (audioBusy || (sessionUploadsRef.current.size > 0 && !savedRef.current)) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [audioBusy]);

  function setField(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (audioBusy) return;
    setError("");

    const payload: Record<string, string | boolean | number> = {};
    for (const field of section.fields) {
      const raw = values[field.name];
      if (field.type === "number") {
        payload[field.name] = raw === "" ? 0 : Number(raw);
      } else if (field.type === "audio") {
        const url = String(raw).trim();
        if (url && !isStoredPodcastAudio(url) && !/^https?:\/\/\S+$/i.test(url)) {
          setError("الرابط الصوتي الخارجي غير صالح. يجب أن يبدأ بـ https:// أو http://");
          return;
        }
        payload[field.name] = url;
      } else {
        payload[field.name] = raw;
      }
    }

    setSaving(true);

    const supabase = createClient();
    const { error } = isEditing
      ? await supabase.from(section.table).update(payload).eq("id", recordId)
      : await supabase.from(section.table).insert(payload);

    if (error) {
      // الملف المرفوع يبقى في النموذج لإعادة محاولة الحفظ
      setSaving(false);
      setError("حدث خطأ أثناء الحفظ، حاول مرة أخرى.");
      return;
    }

    savedRef.current = true;

    // بعد نجاح الحفظ فقط: تنظيف الملف القديم والملفات المرفوعة التي لم تُعتمد،
    // بشرط أن تكون من ملفاتنا وألا تستخدمها أي حلقة أخرى.
    if (audioField) {
      const savedUrl = payload[audioField.name];
      const candidates = new Set([...sessionUploadsRef.current, initialAudioUrl]);
      candidates.delete(String(savedUrl));
      await Promise.allSettled(
        [...candidates].map((url) => deleteStoredAudioIfUnused(supabase, url, section.table, audioField.name))
      );
    }

    setSaving(false);
    router.push(section.basePath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {section.fields.map((field) => {
        if (field.type === "checkbox") {
          return (
            <label
              key={field.name}
              htmlFor={field.name}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <input
                id={field.name}
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(e) => setField(field.name, e.target.checked)}
                className="h-4 w-4 border border-border accent-foreground"
              />
              {field.label}
            </label>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className="text-sm text-foreground">
                {field.label}
              </label>
              <select
                id={field.name}
                value={values[field.name] as string}
                onChange={(e) => setField(field.name, e.target.value)}
                className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
              >
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className="text-sm text-foreground">
                {field.label}
              </label>
              {field.hint && (
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              )}
              <textarea
                id={field.name}
                required={field.required}
                rows={field.rows ?? 6}
                value={values[field.name] as string}
                onChange={(e) => setField(field.name, e.target.value)}
                className="resize-y border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
              />
              {section.articlePreview && field.name === "content" && (
                <div className="mt-3 flex flex-col gap-1.5">
                  <span className="text-sm text-foreground">معاينة حيّة</span>
                  <div
                    className="article-body article-preview border border-border p-4"
                    data-spacing={normalizeSpacing(values.paragraph_spacing)}
                  >
                    <MarkdownContent
                      content={(values.content as string) || "ابدأ الكتابة لتظهر المعاينة هنا."}
                      highlightFirst={values.highlight_first_paragraph !== false}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (field.type === "audio") {
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-sm text-foreground">{field.label}</label>
              <AudioUpload
                value={values[field.name] as string}
                onChange={(url) => setField(field.name, url)}
                onUploaded={(url) => sessionUploadsRef.current.add(url)}
                onBusyChange={setAudioBusy}
              />
            </div>
          );
        }

        if (field.type === "image") {
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-sm text-foreground">{field.label}</label>
              <ImageUpload
                value={values[field.name] as string}
                onChange={(url) => setField(field.name, url)}
              />
            </div>
          );
        }

        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm text-foreground">
              {field.label}
            </label>
            {field.type === "text" && field.hint && (
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            )}
            <input
              id={field.name}
              type={field.type === "number" ? "number" : "text"}
              required={field.required}
              value={values[field.name] as string}
              onChange={(e) => setField(field.name, e.target.value)}
              className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
              dir={field.type === "text" ? field.dir : undefined}
            />
          </div>
        );
      })}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving || audioBusy}
          className="bg-primary px-5 py-2.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : audioBusy ? "انتظر اكتمال رفع الملف..." : "حفظ"}
        </button>
        <button
          type="button"
          onClick={() => router.push(section.basePath)}
          className="border border-border px-5 py-2.5 text-foreground transition-opacity hover:opacity-70"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
