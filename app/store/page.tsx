import type { Metadata } from "next";
import { StorePage } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = { title: "المتجر | رحلة مُنجِز", description: "منتجات رحلة مُنجِز المصممة للإنجازات الصغيرة." };

export const dynamic = "force-dynamic";

export default async function Page() {
  const [{ data }, { data: settingsRows }] = await Promise.all([
    supabase
      .from("store_products")
      .select("id, name, description, price, image_url")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["store_title", "store_empty_text"]),
  ]);

  const products = (data ?? []).map((item) => ({
    id: item.id as number,
    name: item.name as string,
    description: item.description as string,
    price: item.price as number,
    imageUrl: item.image_url as string | null,
  }));

  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    if (row.value) settings[row.key as string] = row.value as string;
  }

  return (
    <StorePage
      products={products}
      heroTitle={settings.store_title ?? "أدوات تجعل الإنجاز ملموسًا"}
      heroEmptyDescription={
        settings.store_empty_text ??
        "منتجات صُممت لترافق رحلتك اليومية. المتجر قيد التجهيز وسيُفتح قريباً."
      }
    />
  );
}
