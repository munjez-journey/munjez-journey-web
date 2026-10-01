import { createClient } from "@supabase/supabase-js";

/**
 * عميل Supabase بصلاحية service_role — يتجاوز RLS بالكامل.
 * server-only بشكل صريح: أي محاولة لاستيراده داخل كود يعمل فعلياً في
 * المتصفح (مثل Client Component استوردته بالخطأ) تفشل فوراً بدل أن
 * يُشحَن السر بصمت أو يفشل العميل بصمت لاحقاً. لا يُستدعى إلا من كود
 * خادمي صريح (Server Actions)، حيث SUPABASE_SERVICE_ROLE_KEY متاح فقط.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase/serviceClient يستخدم SUPABASE_SERVICE_ROLE_KEY ولا يجوز استيراده في كود يعمل في المتصفح."
  );
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("متغيرات بيئة Supabase الخادمية غير مكتملة.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
