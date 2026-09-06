"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SectionConfig } from "../_lib/sections";
import SectionForm from "./SectionForm";
import FormCard from "./FormCard";

export default function SectionEditForm({
  section,
  id,
}: {
  section: SectionConfig;
  id: string;
}) {
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const columns = ["id", ...section.fields.map((f) => f.name)].join(", ");

    supabase
      .from(section.table)
      .select<string, Record<string, unknown>>(columns)
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setRecord(data);
        setLoading(false);
      });
  }, [section, id]);

  if (loading) {
    return (
      <p className="p-10 text-center text-muted-foreground">جارٍ التحميل...</p>
    );
  }

  if (notFound || !record) {
    return (
      <p className="p-10 text-center text-muted-foreground">
        العنصر غير موجود.
      </p>
    );
  }

  return (
    <FormCard title={`تعديل ${section.singularLabel}`}>
      <SectionForm section={section} initialValues={record} recordId={id} />
    </FormCard>
  );
}
