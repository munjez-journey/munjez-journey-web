import type { Metadata } from "next";
import { StorePage } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = { title: "المتجر | رحلة مُنجِز", description: "منتجات رحلة مُنجِز المصممة للإنجازات الصغيرة." };

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data } = await supabase
    .from("store_products")
    .select("id, name, description, price, image_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const products = (data ?? []).map((item) => ({
    id: item.id as number,
    name: item.name as string,
    description: item.description as string,
    price: item.price as number,
    imageUrl: item.image_url as string | null,
  }));

  return <StorePage products={products} />;
}
