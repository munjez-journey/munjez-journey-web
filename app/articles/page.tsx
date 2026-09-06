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
    .select("id, title, content, image_url, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const articles = (data ?? []).map((article) => ({
    id: article.id as string | number,
    title: article.title as string,
    excerpt: excerptFromMarkdown((article.content as string) ?? ""),
    imageUrl: article.image_url as string | null,
    date: new Date(article.created_at as string).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }));

  return <ArticlesPage articles={articles} />;
}
