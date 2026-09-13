import type { SupabaseClient } from "@supabase/supabase-js";
import {
  insertTasksBulk,
  insertAchievementsBulk,
  insertGoalsBulk,
  insertRecurringBulk,
} from "./cloudStore";

const MIGRATION_FLAG_KEY = "mj_migrated";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readLocalArray(key: string): any[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * ترحيل بيانات المتصفح (mj_tasks, mj_ach, mj_goals, mj_rec) إلى Supabase
 * مرة واحدة فقط لكل متصفح، عند أول دخول للمستخدم بعد تفعيل الحفظ السحابي.
 * لا يحذف أي بيانات من localStorage — فقط ينسخها ثم يضع علامة mj_migrated.
 */
export async function migrateLocalStorageIfNeeded(
  supabase: SupabaseClient,
  userId: string
): Promise<{ migrated: boolean; error?: string }> {
  if (typeof window === "undefined") return { migrated: false };
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === "true") {
    return { migrated: false };
  }

  const localTasks = readLocalArray("mj_tasks");
  const localAch = readLocalArray("mj_ach");
  const localGoals = readLocalArray("mj_goals");
  const localRec = readLocalArray("mj_rec");

  try {
    await insertTasksBulk(
      supabase,
      userId,
      localTasks.map((t) => ({
        name: t.name ?? "",
        date: t.date ?? "",
        from: t.from ?? "",
        to: t.to ?? "",
        achieve: Boolean(t.achieve),
        done: Boolean(t.done),
        archived: Boolean(t.archived),
      }))
    );

    await insertAchievementsBulk(
      supabase,
      userId,
      localAch.map((a) => ({
        name: a.name ?? "",
        date: a.date ?? "",
        cat: a.cat ?? "",
        note: a.note ?? null,
        imgs: Array.isArray(a.imgs) ? a.imgs : [],
        files: Array.isArray(a.files) ? a.files : [],
        feat: Boolean(a.feat),
      }))
    );

    await insertGoalsBulk(
      supabase,
      userId,
      localGoals.map((g) => ({
        name: g.name ?? "",
        cat: g.cat ?? "",
        imp: Boolean(g.imp),
        note: g.note ?? null,
        done: Boolean(g.done),
        ach: Boolean(g.ach),
      }))
    );

    await insertRecurringBulk(
      supabase,
      userId,
      localRec.map((r) => ({
        name: r.name ?? "",
        freq: r.freq ?? "daily",
        weekday: r.weekday ?? null,
        from: r.from ?? "",
        achieve: Boolean(r.achieve),
        active: Boolean(r.active),
        done: Boolean(r.done),
      }))
    );

    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
    return { migrated: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير معروف أثناء الترحيل";
    return { migrated: false, error: message };
  }
}
