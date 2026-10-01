"use server";

import { createServiceClient } from "@/lib/supabase/serviceClient";

type SubscribeResult = { ok: true } | { ok: false };

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function subscribeToNewsletter(
  firstName: string,
  email: string
): Promise<SubscribeResult> {
  const name = firstName.trim();
  const normalizedEmail = email.trim();

  if (!name || !normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { ok: false };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("subscribe_to_newsletter", {
    p_first_name: name,
    p_email: normalizedEmail,
  });

  if (error) {
    return { ok: false };
  }

  // data الداخلي: created | reactivated | already_active — لا يُكشف
  // للواجهة أبداً. الفروع هنا مكانها المخصص لاحقاً لإرسال رسالة
  // الترحيب (created وreactivated فقط)؛ في هذه المرحلة كلها تُعامَل
  // كنجاح متطابق الاستجابة.
  switch (data) {
    case "created":
    case "reactivated":
    case "already_active":
      return { ok: true };
    default:
      return { ok: false };
  }
}
