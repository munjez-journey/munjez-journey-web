import type { Metadata } from "next";
import { NewsPage } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = { title: "الأخبار | رحلة مُنجِز", description: "آخر أخبار وتحديثات رحلة مُنجِز." };

export const dynamic = "force-dynamic";

function excerptFromMarkdown(content: string, maxLength = 140): string {
  const plain = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trimEnd() + "…";
}

export default async function Page() {
  const { data } = await supabase
    .from("news")
    .select("id, title, content, image_url, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const news = (data ?? []).map((item) => ({
    id: item.id as number,
    title: item.title as string,
    excerpt: excerptFromMarkdown((item.content as string) ?? ""),
    imageUrl: item.image_url as string | null,
    date: new Date(item.created_at as string).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }));

  const newsIds = (data ?? []).map((item) => item.id as number);
  const likeCounts: Record<number, number> = {};
  if (newsIds.length > 0) {
    const { data: counts } = await supabase
      .from("like_counts")
      .select("content_id, likes_count")
      .eq("content_type", "news")
      .in("content_id", newsIds);
    for (const row of counts ?? []) {
      likeCounts[row.content_id as number] = row.likes_count as number;
    }
  }

  return <NewsPage news={news} likeCounts={likeCounts} />;
}
