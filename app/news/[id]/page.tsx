import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import { supabase } from "@/lib/supabaseClient";
import MarkdownContent from "../../articles/MarkdownContent";
import LikeButton from "../../articles/LikeButton";
import BookmarkButton from "../../articles/BookmarkButton";

export const dynamic = "force-dynamic";

export default async function DynamicNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: item, error } = await supabase
    .from("news")
    .select("id, title, content, image_url, is_published, created_at")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !item) {
    notFound();
  }

  const { data: countRow } = await supabase
    .from("like_counts")
    .select("likes_count")
    .eq("content_type", "news")
    .eq("content_id", item.id)
    .maybeSingle();
  const likeCount = countRow?.likes_count ?? 0;

  return (
    <PageFrame>
      <article className="article-page shell">
        <Link className="back-link" href="/news">
          <ArrowRight size={17} /> جميع الأخبار
        </Link>

        <header>
          <span>الأخبار</span>
          <h1>{item.title}</h1>
          <div>
            <time>
              {new Date(item.created_at).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <LikeButton contentType="news" contentId={item.id} initialCount={likeCount} />
            <BookmarkButton contentType="news" contentId={item.id} />
          </div>
        </header>

        {item.image_url && (
          <div className="article-hero">
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 1200px"
              unoptimized
            />
          </div>
        )}

        <div className="article-body">
          <MarkdownContent content={item.content ?? ""} />
        </div>
      </article>
    </PageFrame>
  );
}
