"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/userClient";
import { PageFrame } from "@/components/site-chrome";
import { PageIntro } from "@/components/content-pages";
import type { LikeContentType } from "@/app/articles/LikeButton";

type AccountCard = {
  key: string;
  contentType: LikeContentType;
  title: string;
  imageUrl: string | null;
  href: string;
};

const typeLabels: Record<LikeContentType, string> = {
  article: "مقال",
  news: "خبر",
  podcast: "حلقة بودكاست",
  champion: "بطل رحلة",
};

function buildHref(contentType: LikeContentType, id: number, slug?: string) {
  if (contentType === "article") return `/articles/${id}`;
  if (contentType === "news") return `/news/${id}`;
  if (contentType === "podcast") return `/podcast/${id}`;
  return `/champions/${slug}`;
}

export default function AccountContent({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<"likes" | "bookmarks">("likes");
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<AccountCard[]>([]);
  const [savedItems, setSavedItems] = useState<AccountCard[]>([]);

  const [savedDisplayName, setSavedDisplayName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const supabase = createUserClient();
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const current = data?.display_name ?? null;
      setSavedDisplayName(current);
      setNameInput(current ?? "");
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function handleSaveName(event: React.FormEvent) {
    event.preventDefault();
    if (savingName) return;

    setSavingName(true);
    setNameError("");
    setNameSaved(false);

    const supabase = createUserClient();
    const trimmed = nameInput.trim();

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed || null })
      .eq("id", user.id);

    setSavingName(false);

    if (error) {
      setNameError("تعذّر حفظ الاسم. حاول مرة أخرى.");
      setNameInput(savedDisplayName ?? "");
      return;
    }

    setSavedDisplayName(trimmed || null);
    setNameInput(trimmed);
    setNameSaved(true);
  }

  const displayName =
    savedDisplayName || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "حسابي";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createUserClient();

      const [{ data: likeRows }, { data: bookmarkRows }] = await Promise.all([
        supabase
          .from("likes")
          .select("content_type, content_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookmarks")
          .select("content_type, content_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const idsByType: Record<LikeContentType, Set<number>> = {
        article: new Set(),
        news: new Set(),
        podcast: new Set(),
        champion: new Set(),
      };

      for (const row of [...(likeRows ?? []), ...(bookmarkRows ?? [])]) {
        idsByType[row.content_type as LikeContentType].add(row.content_id as number);
      }

      const cardsByType: Record<LikeContentType, Map<number, AccountCard>> = {
        article: new Map(),
        news: new Map(),
        podcast: new Map(),
        champion: new Map(),
      };

      await Promise.all([
        (async () => {
          const ids = Array.from(idsByType.article);
          if (ids.length === 0) return;
          const { data } = await supabase
            .from("articles")
            .select("id, title, image_url")
            .eq("is_published", true)
            .in("id", ids);
          for (const item of data ?? []) {
            cardsByType.article.set(item.id as number, {
              key: `article-${item.id}`,
              contentType: "article",
              title: item.title as string,
              imageUrl: item.image_url as string | null,
              href: buildHref("article", item.id as number),
            });
          }
        })(),
        (async () => {
          const ids = Array.from(idsByType.news);
          if (ids.length === 0) return;
          const { data } = await supabase
            .from("news")
            .select("id, title, image_url")
            .eq("is_published", true)
            .in("id", ids);
          for (const item of data ?? []) {
            cardsByType.news.set(item.id as number, {
              key: `news-${item.id}`,
              contentType: "news",
              title: item.title as string,
              imageUrl: item.image_url as string | null,
              href: buildHref("news", item.id as number),
            });
          }
        })(),
        (async () => {
          const ids = Array.from(idsByType.podcast);
          if (ids.length === 0) return;
          const { data } = await supabase
            .from("podcast_episodes")
            .select("id, title, image_url")
            .eq("is_published", true)
            .in("id", ids);
          for (const item of data ?? []) {
            cardsByType.podcast.set(item.id as number, {
              key: `podcast-${item.id}`,
              contentType: "podcast",
              title: item.title as string,
              imageUrl: item.image_url as string | null,
              href: buildHref("podcast", item.id as number),
            });
          }
        })(),
        (async () => {
          const ids = Array.from(idsByType.champion);
          if (ids.length === 0) return;
          const { data } = await supabase
            .from("champions")
            .select("id, slug, name, image_url")
            .eq("is_published", true)
            .in("id", ids);
          for (const item of data ?? []) {
            cardsByType.champion.set(item.id as number, {
              key: `champion-${item.id}`,
              contentType: "champion",
              title: item.name as string,
              imageUrl: item.image_url as string | null,
              href: buildHref("champion", item.id as number, item.slug as string),
            });
          }
        })(),
      ]);

      if (cancelled) return;

      const liked = (likeRows ?? [])
        .map((row) => cardsByType[row.content_type as LikeContentType].get(row.content_id as number))
        .filter((card): card is AccountCard => Boolean(card));

      const saved = (bookmarkRows ?? [])
        .map((row) => cardsByType[row.content_type as LikeContentType].get(row.content_id as number))
        .filter((card): card is AccountCard => Boolean(card));

      setLikedItems(liked);
      setSavedItems(saved);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const items = activeTab === "likes" ? likedItems : savedItems;
  const emptyMessage =
    activeTab === "likes" ? "لم تُعجب بأي محتوى بعد." : "لم تحفظ أي محتوى بعد.";

  return (
    <PageFrame>
      <PageIntro kicker="حسابي" title={displayName} description="إعجاباتك ومحفوظاتك في مكان واحد." />
      <section className="account-section shell">
        <form className="account-name-form" onSubmit={handleSaveName}>
          <label htmlFor="display-name">كيف تحب نناديك؟</label>
          <div className="account-name-row">
            <input
              id="display-name"
              type="text"
              maxLength={60}
              value={nameInput}
              onChange={(event) => {
                setNameInput(event.target.value);
                setNameSaved(false);
              }}
              placeholder="اكتب اسمك هنا…"
            />
            <button type="submit" disabled={savingName}>
              {savingName ? "جارٍ الحفظ..." : "حفظ"}
            </button>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>سنستخدمه للترحيب بك.</p>
          {nameError && <p className="account-name-message error">{nameError}</p>}
          {nameSaved && !nameError && <p className="account-name-message success">تم الحفظ.</p>}
        </form>

        <div className="account-tabs">
          <button
            type="button"
            className={activeTab === "likes" ? "account-tab active" : "account-tab"}
            onClick={() => setActiveTab("likes")}
          >
            إعجاباتي
          </button>
          <button
            type="button"
            className={activeTab === "bookmarks" ? "account-tab active" : "account-tab"}
            onClick={() => setActiveTab("bookmarks")}
          >
            محفوظاتي
          </button>
        </div>

        {loading ? (
          <p style={{ padding: "40px 0", color: "var(--muted)" }}>جارٍ التحميل...</p>
        ) : items.length === 0 ? (
          <p style={{ padding: "40px 0", color: "var(--muted)" }}>{emptyMessage}</p>
        ) : (
          <div className="account-list">
            {items.map((item) => (
              <Link className="account-card" href={item.href} key={item.key}>
                {item.imageUrl && <img className="account-card-image" src={item.imageUrl} alt={item.title} />}
                <div>
                  <span className="account-card-type">{typeLabels[item.contentType]}</span>
                  <h3>{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
