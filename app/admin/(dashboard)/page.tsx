"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sections } from "../_lib/sections";

type Counts = Record<string, number | null>;

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadCounts() {
      const entries = await Promise.all(
        Object.values(sections).map(async (section) => {
          const { count, error } = await supabase
            .from(section.table)
            .select("id", { count: "exact", head: true });
          return [section.key, error ? null : count ?? 0] as const;
        })
      );
      setCounts(Object.fromEntries(entries));
      setLoading(false);
    }

    loadCounts();
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold text-foreground">
        نظرة عامة
      </h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(sections).map((section) => (
          <Link
            key={section.key}
            href={section.basePath}
            className="border border-border bg-card p-6 shadow-sm transition-opacity hover:opacity-80"
          >
            <p className="text-sm text-muted-foreground">{section.label}</p>
            <p className="mt-3 text-4xl font-semibold text-foreground">
              {loading
                ? "..."
                : counts[section.key] === null
                  ? "—"
                  : counts[section.key]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
