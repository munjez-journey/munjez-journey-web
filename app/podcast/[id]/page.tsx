import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import { supabase } from "@/lib/supabaseClient";
import LikeButton from "../../articles/LikeButton";

export const dynamic = "force-dynamic";

export default async function DynamicPodcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: item, error } = await supabase
    .from("podcast_episodes")
    .select("id, title, description, image_url, audio_url, is_published, created_at")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !item) {
    notFound();
  }

  const { data: countRow } = await supabase
    .from("like_counts")
    .select("likes_count")
    .eq("content_type", "podcast")
    .eq("content_id", item.id)
    .maybeSingle();
  const likeCount = countRow?.likes_count ?? 0;

  return (
    <PageFrame>
      <article className="article-page shell">
        <Link className="back-link" href="/podcast">
          <ArrowRight size={17} /> جميع الحلقات
        </Link>

        <header>
          <span>بودكاست خُطوة</span>
          <h1>{item.title}</h1>
          <div>
            <time>
              {new Date(item.created_at).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <LikeButton contentType="podcast" contentId={item.id} initialCount={likeCount} />
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

        {item.audio_url && (
          <audio className="podcast-player" controls src={item.audio_url} style={{ width: "100%", margin: "24px 0" }}>
            متصفحك لا يدعم تشغيل الصوت.
          </audio>
        )}

        {item.description && (
          <div className="article-body">
            <p>{item.description}</p>
          </div>
        )}
      </article>
    </PageFrame>
  );
}
