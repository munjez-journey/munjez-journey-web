import type { Metadata } from "next";
import { PodcastPage } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = { title: "بودكاست خُطوة | رحلة مُنجِز", description: "حلقات قصيرة وعملية تساعدك على تجاوز التعثر والعودة إلى خطوتك التالية." };

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data } = await supabase
    .from("podcast_episodes")
    .select("id, title, description, image_url, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const episodes = (data ?? []).map((item) => ({
    id: item.id as number,
    title: item.title as string,
    description: item.description as string | null,
    imageUrl: item.image_url as string | null,
    date: new Date(item.created_at as string).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }));

  const episodeIds = (data ?? []).map((item) => item.id as number);
  const likeCounts: Record<number, number> = {};
  if (episodeIds.length > 0) {
    const { data: counts } = await supabase
      .from("like_counts")
      .select("content_id, likes_count")
      .eq("content_type", "podcast")
      .in("content_id", episodeIds);
    for (const row of counts ?? []) {
      likeCounts[row.content_id as number] = row.likes_count as number;
    }
  }

  return <PodcastPage episodes={episodes} likeCounts={likeCounts} />;
}
