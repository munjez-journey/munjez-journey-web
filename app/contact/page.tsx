import type { Metadata } from "next";
import { ContactPage } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = { title: "تواصل معنا | رحلة مُنجِز", description: "قنوات التواصل الرسمية مع رحلة مُنجِز." };

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["contact_email_hello", "contact_email_info", "contact_email_support"]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value) settings[row.key as string] = row.value as string;
  }

  return (
    <ContactPage
      helloEmail={settings.contact_email_hello ?? "hello@munjez-journey.com"}
      infoEmail={settings.contact_email_info ?? "info@munjez-journey.com"}
      supportEmail={settings.contact_email_support ?? "support@munjez-journey.com"}
    />
  );
}
