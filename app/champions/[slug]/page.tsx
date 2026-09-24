import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import { supabase } from "@/lib/supabaseClient";
import MarkdownContent from "../../articles/MarkdownContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: champion } = await supabase
    .from("champions")
    .select("name, short_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!champion) return {};

  return {
    title: `${champion.name} | أبطال الرحلة`,
    description: champion.short_description ?? undefined,
  };
}

export default async function ChampionStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: champion, error } = await supabase
    .from("champions")
    .select("name, tag, short_description, story_content, image_url, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !champion) {
    notFound();
  }

  return (
    <PageFrame>
      <article className="article-page champion-story shell">
        <Link className="back-link" href="/champions">
          <ArrowRight size={17} /> أبطال الرحلة
        </Link>

        <header>
          {champion.tag && <span>{champion.tag}</span>}
          <h1>{champion.name}</h1>
          {champion.short_description && <p>{champion.short_description}</p>}
        </header>

        {champion.image_url && (
          <div className="champion-story-hero">
            <img src={champion.image_url} alt={champion.name} />
          </div>
        )}

        <div className="article-body">
          <MarkdownContent content={champion.story_content ?? ""} />
        </div>
      </article>
    </PageFrame>
  );
}
