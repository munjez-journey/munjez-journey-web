import { createBrowserClient } from "@supabase/ssr";

/**
 * عميل Supabase للاستخدام العام بدون مصادقة (مثل نموذج الاشتراك بالنشرة).
 * لا يحمل أي جلسة مستخدم، ولا يُستخدم إلا لاستدعاء دوال RPC عامة
 * (SECURITY DEFINER) لا تتطلب تسجيل دخول.
 */
export function createPublicClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
