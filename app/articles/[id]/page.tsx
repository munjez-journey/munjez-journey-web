import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import { supabase } from "@/lib/supabaseClient";
import MarkdownContent from "../MarkdownContent";
import LikeButton from "../LikeButton";

export const dynamic = "force-dynamic";

export default async function DynamicArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: article, error } = await supabase
    .from("articles")
    .select(
      "id, title, description, content, image_url, author, is_published, created_at"
    )
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !article) {
    notFound();
  }

  const wordCount = (article.content ?? "").trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));
  const authorName = article.author || "فريق رحلة مُنجِز";

  const { data: countRow } = await supabase
    .from("like_counts")
    .select("likes_count")
    .eq("content_type", "article")
    .eq("content_id", article.id)
    .maybeSingle();
  const likeCount = countRow?.likes_count ?? 0;

  return (
    <PageFrame>
      <article className="article-page shell">
        <Link className="back-link" href="/articles">
          <ArrowRight size={17} /> جميع المقالات
        </Link>

        <header>
          <span>{readingMinutes} دقائق قراءة</span>
          <h1>{article.title}</h1>
          {article.description && <p>{article.description}</p>}
          <div>
            <b>{authorName}</b>
            <time>
              {new Date(article.created_at).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <LikeButton contentType="article" contentId={Number(article.id)} initialCount={likeCount} />
          </div>
        </header>

        {article.image_url && (
          <div className="article-hero">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 1200px"
              unoptimized
            />
          </div>
        )}

        <div className="article-body">
          <MarkdownContent content={article.content ?? ""} />
        </div>
      </article>
    </PageFrame>
  );
}
