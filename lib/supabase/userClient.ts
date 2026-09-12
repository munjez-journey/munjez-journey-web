import { createBrowserClient } from "@supabase/ssr";

/**
 * عميل Supabase منفصل تماماً عن عميل لوحة تحكم الأدمن (lib/supabase/client.ts).
 * يستخدم storageKey مختلفاً حتى لا تتداخل جلسة تسجيل دخول المستخدم العادي
 * في /tasks مع جلسة تسجيل دخول الأدمن في /admin داخل نفس المتصفح.
 */
export function createUserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: "sb-munjez-tasks-auth",
      },
    }
  );
}
