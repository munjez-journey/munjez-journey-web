import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * طبقة بيانات موحّدة للتعامل مع جداول تطبيق المهام في Supabase
 * (tasks, achievements, goals, recurring). كل الدوال هنا تفترض أن
 * المستخدم مسجّل دخول بالفعل (userClient) وتربط كل صف بـ user_id.
 *
 * أشكال الحقول هنا مطابقة تماماً لما تستخدمه الواجهة محلياً؛ الفرق
 * الوحيد هو تحويل from/to إلى from_time/to_time عند الحديث مع القاعدة،
 * لأن هذه هي أسماء الأعمدة الفعلية في جداول tasks وrecurring.
 */

/* ===================== Tasks ===================== */

export type CloudTask = {
  id: string;
  name: string;
  date: string;
  from: string;
  to: string;
  achieve: boolean;
  done: boolean;
  archived: boolean;
};

type TaskRow = {
  id: string;
  name: string;
  date: string | null;
  from_time: string | null;
  to_time: string | null;
  achieve: boolean;
  done: boolean;
  archived: boolean;
};

const TASK_COLUMNS = "id, name, date, from_time, to_time, achieve, done, archived";

function rowToTask(row: TaskRow): CloudTask {
  return {
    id: row.id,
    name: row.name,
    date: row.date ?? "",
    from: row.from_time ?? "",
    to: row.to_time ?? "",
    achieve: row.achieve,
    done: row.done,
    archived: row.archived,
  };
}

function taskToRow(task: Omit<CloudTask, "id">) {
  return {
    name: task.name,
    date: task.date || null,
    from_time: task.from || null,
    to_time: task.to || null,
    achieve: task.achieve,
    done: task.done,
    archived: task.archived,
  };
}

export async function listTasks(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TaskRow[]).map(rowToTask);
}

export async function insertTask(
  supabase: SupabaseClient,
  userId: string,
  task: Omit<CloudTask, "id">
): Promise<CloudTask> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, ...taskToRow(task) })
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return rowToTask(data as TaskRow);
}

export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Omit<CloudTask, "id">>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.date !== undefined) payload.date = patch.date || null;
  if (patch.from !== undefined) payload.from_time = patch.from || null;
  if (patch.to !== undefined) payload.to_time = patch.to || null;
  if (patch.achieve !== undefined) payload.achieve = patch.achieve;
  if (patch.done !== undefined) payload.done = patch.done;
  if (patch.archived !== undefined) payload.archived = patch.archived;

  const { error } = await supabase.from("tasks").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function insertTasksBulk(
  supabase: SupabaseClient,
  userId: string,
  tasks: Omit<CloudTask, "id">[]
): Promise<void> {
  if (tasks.length === 0) return;
  const rows = tasks.map((t) => ({ user_id: userId, ...taskToRow(t) }));
  const { error } = await supabase.from("tasks").insert(rows);
  if (error) throw error;
}

/* ===================== Achievements ===================== */

export type CloudAchievement = {
  id: string;
  name: string;
  date: string;
  cat: string;
  note: string | null;
  imgs: unknown[];
  files: unknown[];
  feat: boolean;
};

const ACH_COLUMNS = "id, name, date, cat, note, imgs, files, feat";

export async function listAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudAchievement[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select(ACH_COLUMNS)
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudAchievement[];
}

export async function insertAchievement(
  supabase: SupabaseClient,
  userId: string,
  achievement: Omit<CloudAchievement, "id">
): Promise<CloudAchievement> {
  const { data, error } = await supabase
    .from("achievements")
    .insert({ user_id: userId, ...achievement })
    .select(ACH_COLUMNS)
    .single();
  if (error) throw error;
  return data as CloudAchievement;
}

export async function updateAchievement(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Omit<CloudAchievement, "id">>
): Promise<void> {
  const { error } = await supabase.from("achievements").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteAchievement(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) throw error;
}

export async function insertAchievementsBulk(
  supabase: SupabaseClient,
  userId: string,
  achievements: Omit<CloudAchievement, "id">[]
): Promise<void> {
  if (achievements.length === 0) return;
  const rows = achievements.map((a) => ({ user_id: userId, ...a }));
  const { error } = await supabase.from("achievements").insert(rows);
  if (error) throw error;
}

/* ===================== Goals ===================== */

export type CloudGoal = {
  id: string;
  name: string;
  cat: string;
  imp: boolean;
  note: string | null;
  done: boolean;
  ach: boolean;
};

const GOAL_COLUMNS = "id, name, cat, imp, note, done, ach";

export async function listGoals(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudGoal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_COLUMNS)
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as CloudGoal[];
}

export async function insertGoal(
  supabase: SupabaseClient,
  userId: string,
  goal: Omit<CloudGoal, "id">
): Promise<CloudGoal> {
  const { data, error } = await supabase
    .from("goals")
    .insert({ user_id: userId, ...goal })
    .select(GOAL_COLUMNS)
    .single();
  if (error) throw error;
  return data as CloudGoal;
}

export async function updateGoal(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Omit<CloudGoal, "id">>
): Promise<void> {
  const { error } = await supabase.from("goals").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export async function insertGoalsBulk(
  supabase: SupabaseClient,
  userId: string,
  goals: Omit<CloudGoal, "id">[]
): Promise<void> {
  if (goals.length === 0) return;
  const rows = goals.map((g) => ({ user_id: userId, ...g }));
  const { error } = await supabase.from("goals").insert(rows);
  if (error) throw error;
}

/* ===================== Recurring ===================== */

export type CloudRecurring = {
  id: string;
  name: string;
  freq: string;
  weekday: number | null;
  from: string;
  achieve: boolean;
  active: boolean;
  done: boolean;
};

type RecurringRow = {
  id: string;
  name: string;
  freq: string;
  weekday: number | null;
  from_time: string | null;
  achieve: boolean;
  active: boolean;
  done: boolean;
};

const REC_COLUMNS = "id, name, freq, weekday, from_time, achieve, active, done";

function rowToRecurring(row: RecurringRow): CloudRecurring {
  return {
    id: row.id,
    name: row.name,
    freq: row.freq,
    weekday: row.weekday,
    from: row.from_time ?? "",
    achieve: row.achieve,
    active: row.active,
    done: row.done,
  };
}

function recurringToRow(rec: Omit<CloudRecurring, "id">) {
  return {
    name: rec.name,
    freq: rec.freq,
    weekday: rec.weekday,
    from_time: rec.from || null,
    achieve: rec.achieve,
    active: rec.active,
    done: rec.done,
  };
}

export async function listRecurring(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudRecurring[]> {
  const { data, error } = await supabase
    .from("recurring")
    .select(REC_COLUMNS)
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as RecurringRow[]).map(rowToRecurring);
}

export async function insertRecurring(
  supabase: SupabaseClient,
  userId: string,
  rec: Omit<CloudRecurring, "id">
): Promise<CloudRecurring> {
  const { data, error } = await supabase
    .from("recurring")
    .insert({ user_id: userId, ...recurringToRow(rec) })
    .select(REC_COLUMNS)
    .single();
  if (error) throw error;
  return rowToRecurring(data as RecurringRow);
}

export async function updateRecurring(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Omit<CloudRecurring, "id">>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.freq !== undefined) payload.freq = patch.freq;
  if (patch.weekday !== undefined) payload.weekday = patch.weekday;
  if (patch.from !== undefined) payload.from_time = patch.from || null;
  if (patch.achieve !== undefined) payload.achieve = patch.achieve;
  if (patch.active !== undefined) payload.active = patch.active;
  if (patch.done !== undefined) payload.done = patch.done;

  const { error } = await supabase.from("recurring").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteRecurring(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("recurring").delete().eq("id", id);
  if (error) throw error;
}

export async function insertRecurringBulk(
  supabase: SupabaseClient,
  userId: string,
  items: Omit<CloudRecurring, "id">[]
): Promise<void> {
  if (items.length === 0) return;
  const rows = items.map((r) => ({ user_id: userId, ...recurringToRow(r) }));
  const { error } = await supabase.from("recurring").insert(rows);
  if (error) throw error;
}
