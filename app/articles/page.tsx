import type { Metadata } from "next";
import { ArticlesPage } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = { title: "المقالات | رحلة مُنجِز", description: "مقالات رحلة مُنجِز عن الاستمرارية وتنظيم الوقت والإنجازات الصغيرة." };

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
    .from("articles")
    .select("id, title, description, content, image_url, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const articles = (data ?? []).map((article) => {
    const wordCount = ((article.content as string) ?? "").trim().split(/\s+/).filter(Boolean).length;
    return {
      id: article.id as string | number,
      title: article.title as string,
      excerpt:
        (article.description as string | null) ||
        excerptFromMarkdown((article.content as string) ?? ""),
      imageUrl: article.image_url as string | null,
      date: new Date(article.created_at as string).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      readingMinutes: Math.max(1, Math.round(wordCount / 200)),
    };
  });

  const articleIds = (data ?? []).map((article) => article.id as number);
  const likeCounts: Record<number, number> = {};
  if (articleIds.length > 0) {
    const { data: counts } = await supabase
      .from("like_counts")
      .select("content_id, likes_count")
      .eq("content_type", "article")
      .in("content_id", articleIds);
    for (const row of counts ?? []) {
      likeCounts[row.content_id as number] = row.likes_count as number;
    }
  }

  return <ArticlesPage articles={articles} likeCounts={likeCounts} />;
}
