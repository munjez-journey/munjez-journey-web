import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import { PageIntro } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";
import LikeButton from "@/app/articles/LikeButton";
import BookmarkButton from "@/app/articles/BookmarkButton";

export const metadata: Metadata = {
  title: "أبطال الرحلة | رحلة مُنجِز",
  description: "قصص حقيقية الطابع عن أشخاص عاديين واصلوا خطواتهم الصغيرة.",
};

export const dynamic = "force-dynamic";

export default async function ChampionsPage() {
  const { data } = await supabase
    .from("champions")
    .select("id, slug, name, tag, short_description, image_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const champions = data ?? [];

  const championIds = champions.map((champion) => champion.id as number);
  const likeCounts: Record<number, number> = {};
  if (championIds.length > 0) {
    const { data: counts } = await supabase
      .from("like_counts")
      .select("content_id, likes_count")
      .eq("content_type", "champion")
      .in("content_id", championIds);
    for (const row of counts ?? []) {
      likeCounts[row.content_id as number] = row.likes_count as number;
    }
  }

  return <PageFrame>
    <PageIntro kicker="أبطال الرحلة" title="أشخاص عاديون، رحلات تستحق أن تُروى" description="نشارك تجارب أشخاص لم يبدأوا بظروف مثالية، لكنهم وجدوا خطوتهم التالية واستمروا." />
    <section className="champions-list shell">
      {champions.length === 0 && <p style={{ padding: "40px 0", color: "var(--muted)" }}>لا توجد قصص منشورة بعد.</p>}
      {champions.map((champion) => (
        <Link className="champion-feature" href={`/champions/${champion.slug}`} key={champion.id}>
          <div className="champion-image">{champion.image_url && <img src={champion.image_url} alt={champion.name} />}</div>
          <div>
            {champion.tag && <span className="content-tag">{champion.tag}</span>}
            <h2>{champion.name}</h2>
            {champion.short_description && <p>{champion.short_description}</p>}
            <div className="editorial-card-actions">
              <b>اقرأ القصة <ArrowLeft size={18} /></b>
              <div className="card-actions-buttons">
                <LikeButton contentType="champion" contentId={champion.id} initialCount={likeCounts[champion.id] ?? 0} />
                <BookmarkButton contentType="champion" contentId={champion.id} />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </section>
  </PageFrame>;
}
