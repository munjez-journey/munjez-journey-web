"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SectionConfig } from "../_lib/sections";

type Row = {
  id: string;
  is_published: boolean;
  created_at: string;
  [key: string]: unknown;
};

export default function SectionList({ section }: { section: SectionConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRows() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from(section.table)
      .select<string, Row>(`id, ${section.titleField}, is_published, created_at`)
      .order("created_at", { ascending: false });

    if (error) {
      setError(`تعذّر تحميل بيانات "${section.label}".`);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.table]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف هذا ${section.singularLabel}؟`
    );
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from(section.table).delete().eq("id", id);

    if (error) {
      window.alert(`تعذّر حذف هذا ${section.singularLabel}.`);
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          {section.label}
        </h1>
        <Link
          href={`${section.basePath}/new`}
          className="bg-primary px-4 py-2 text-sm text-primary-foreground! transition-opacity hover:opacity-90 hover:text-primary-foreground!"
        >
          {section.addLabel}
        </Link>
      </div>

      <div className="overflow-hidden border border-border bg-card shadow-sm">
        {loading && (
          <p className="p-10 text-center text-muted-foreground">
            جارٍ التحميل...
          </p>
        )}

        {!loading && error && (
          <p className="p-10 text-center text-destructive">{error}</p>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-14 text-center">
            <p className="font-medium text-foreground">
              لا يوجد {section.singularLabel} بعد
            </p>
            <p className="text-sm text-muted-foreground">
              ابدأ بإضافة أول {section.singularLabel} في هذا القسم.
            </p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-sm text-muted-foreground">
                <th className="px-5 py-3 font-medium">العنوان</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">تاريخ الإنشاء</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-4 font-medium text-foreground">
                    {String(row[section.titleField] ?? "بدون عنوان")}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        row.is_published
                          ? "inline-block bg-foreground px-2.5 py-1 text-xs text-background"
                          : "inline-block border border-border px-2.5 py-1 text-xs text-muted-foreground"
                      }
                    >
                      {row.is_published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`${section.basePath}/${row.id}/edit`}
                        className="border border-border px-3 py-1.5 text-sm text-foreground transition-opacity hover:opacity-70"
                      >
                        تعديل
                      </Link>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="border border-destructive px-3 py-1.5 text-sm text-destructive transition-opacity hover:opacity-70"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
