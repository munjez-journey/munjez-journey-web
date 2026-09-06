"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SectionConfig } from "../_lib/sections";

type Values = Record<string, string | boolean>;

function buildInitialValues(
  fields: SectionConfig["fields"],
  initialValues?: Record<string, unknown>
): Values {
  const values: Values = {};
  for (const field of fields) {
    const existing = initialValues?.[field.name];
    if (field.type === "checkbox") {
      values[field.name] = Boolean(existing ?? false);
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

  function setField(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload: Record<string, string | boolean | number> = {};
    for (const field of section.fields) {
      const raw = values[field.name];
      if (field.type === "number") {
        payload[field.name] = raw === "" ? 0 : Number(raw);
      } else {
        payload[field.name] = raw;
      }
    }

    const supabase = createClient();
    const { error } = isEditing
      ? await supabase.from(section.table).update(payload).eq("id", recordId)
      : await supabase.from(section.table).insert(payload);

    setSaving(false);

    if (error) {
      setError("حدث خطأ أثناء الحفظ، حاول مرة أخرى.");
      return;
    }

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
            </div>
          );
        }

        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm text-foreground">
              {field.label}
            </label>
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
          disabled={saving}
          className="bg-primary px-5 py-2.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ"}
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
