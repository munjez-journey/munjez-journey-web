import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Headphones, Play, ShoppingBag } from "lucide-react";
import { JourneyAccess, Newsletter, PageFrame } from "@/components/site-chrome";
import { supabase } from "@/lib/supabaseClient";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function Home() {
  const [
    { data: articleRows },
    { data: championRows },
    { data: episodeRows },
    { data: newsRows },
    { data: productRows },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, description, content, image_url, author, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("champions")
      .select("id, slug, name, short_description, image_url")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("podcast_episodes")
      .select("id, title, description, image_url, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("news")
      .select("id, title, content, image_url, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("store_products")
      .select("id, name, description, price, image_url")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  const article = articleRows?.[0] ?? null;
  const champion = championRows?.[0] ?? null;
  const episodes = episodeRows ?? [];
  const [mainEpisode, ...restEpisodes] = episodes;
  const news = newsRows ?? [];
  const products = productRows ?? [];

  const articleReadingMinutes = article
    ? Math.max(1, Math.round((article.content ?? "").trim().split(/\s+/).filter(Boolean).length / 200))
    : 0;
  const articleExcerpt = article
    ? (article.description as string | null) || excerptFromMarkdown((article.content as string) ?? "")
    : "";
  const articleAuthor = article?.author || "فريق رحلة مُنجِز";

  return (
    <PageFrame>
      {article && (
        <section className="feature shell" aria-labelledby="feature-title">
          <Link className="feature-image" href={`/articles/${article.id}`} aria-label="قراءة المقال المميز">
            {article.image_url && (
              <Image src={article.image_url} alt={article.title} fill sizes="(max-width: 800px) 100vw, 58vw" priority unoptimized />
            )}
            <span className="image-label">مقال الأسبوع</span>
          </Link>
          <article className="feature-copy">
            <div className="eyebrow"><span>رحلة الإنجاز</span><span>{articleReadingMinutes} دقائق قراءة</span></div>
            <h1 id="feature-title">{article.title}</h1>
            <p className="feature-lead">{articleExcerpt}</p>
            <div className="article-meta">
              <div><strong>{articleAuthor}</strong><span>{formatDate(article.created_at)}</span></div>
              <Link href={`/articles/${article.id}`}>اقرأ المقال <ArrowLeft size={18} /></Link>
            </div>
          </article>
        </section>
      )}

      <section className="manifesto shell" aria-label="فلسفة رحلة منجز">
        <p>رحلة مُنجِز</p><h2>وما النجاح إلا<br />إنجازات صغيرة.</h2>
        <p className="manifesto-note">نكتب ونصنع أدوات تساعدك على التقدّم بهدوء، خطوة بعد خطوة.</p>
      </section>

      {champion && (
        <section className="section champions-preview shell">
          <div className="section-heading"><div><span className="section-number">01</span><h2>أبطال الرحلة</h2></div><Link href="/champions">جميع القصص <ArrowUpLeft size={16} /></Link></div>
          <Link className="champion-feature" href={`/champions/${champion.slug}`}>
            <div className="champion-image">{champion.image_url && <img src={champion.image_url} alt={champion.name} />}</div>
            <div>
              <span className="content-tag">بطل الرحلة لهذا الشهر</span>
              <h3>{champion.name}</h3>
              {champion.short_description && <p>{champion.short_description}</p>}
              <b>اقرأ القصة <ArrowLeft size={18} /></b>
            </div>
          </Link>
        </section>
      )}

      {mainEpisode && (
        <section className="section shell" id="podcast">
          <div className="section-heading"><div><span className="section-number">02</span><h2>استمع</h2></div><Link href="/podcast">جميع الحلقات <ArrowUpLeft size={16} /></Link></div>
          <div className="podcast-grid">
            <article className="podcast-main">
              <div className="podcast-art podcast-art-photo">
                {mainEpisode.image_url && <img src={mainEpisode.image_url} alt={mainEpisode.title} />}
                <span>بودكاست خُطوة</span>
                <Headphones size={30} strokeWidth={1.35} />
              </div>
              <div className="podcast-info">
                <span className="content-tag">{formatDate(mainEpisode.created_at)}</span>
                <h3>{mainEpisode.title}</h3>
                {mainEpisode.description && <p>{mainEpisode.description}</p>}
                <Link className="play-button" href={`/podcast/${mainEpisode.id}`}>
                  <Play size={18} fill="currentColor" /> استمع الآن
                </Link>
              </div>
            </article>
            {restEpisodes.length > 0 && (
              <div className="episode-list">
                {restEpisodes.map((episode, i) => (
                  <Link href={`/podcast/${episode.id}`} key={episode.id}>
                    {episode.image_url && <img src={episode.image_url} alt="" />}
                    <span>{String(i + 2).padStart(2, "0")}</span>
                    <div><small>{formatDate(episode.created_at)}</small><strong>{episode.title}</strong></div>
                    <Play size={17} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {news.length > 0 && (
        <section className="section news-section shell" id="news">
          <div className="section-heading"><div><span className="section-number">03</span><h2>آخر الأخبار</h2></div><Link href="/news">المزيد <ArrowUpLeft size={16} /></Link></div>
          <div className="news-grid">
            {news.map((item, i) =>
              i === 0 ? (
                <article className="news-card featured-news" key={item.id}>
                  {item.image_url && <img className="news-card-image" src={item.image_url} alt={item.title} />}
                  <span className="content-tag">من رحلة مُنجِز</span>
                  <h3>{item.title}</h3>
                  <p>{excerptFromMarkdown((item.content as string) ?? "")}</p>
                  <time>{formatDate(item.created_at)}</time>
                </article>
              ) : (
                <article className="news-card" key={item.id}>
                  {item.image_url && <img className="news-card-image" src={item.image_url} alt={item.title} />}
                  <h3>{item.title}</h3>
                  <time>{formatDate(item.created_at)}</time>
                </article>
              )
            )}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="section shell" id="store">
          <div className="section-heading"><div><span className="section-number">04</span><h2>من المتجر</h2></div><Link href="/store">زيارة المتجر <ShoppingBag size={16} /></Link></div>
          <div className="store-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-visual product-visual-image">
                  {product.image_url && <img src={product.image_url} alt={product.name} />}
                </div>
                <div className="product-meta">
                  <div><h3>{product.name}</h3><p>{product.description}</p></div>
                  <strong>{(product.price as number).toLocaleString("ar-EG")} ر.س</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="app-cta" id="app">
        <div className="shell app-cta-inner">
          <div className="app-symbol"><img src="/hourglass-logo.png" alt="شعار رحلة مُنجِز" width="72" height="94" /></div>
          <div className="app-copy"><span>تجربة أولية — التطبيق الكامل قريبًا</span><h2>مهامك اليومية، في مكان واضح</h2><p>مساحة عربية مخصصة لإدارة المهام فقط: أضف ما تريد إنجازه، رتّب يومك، وتابع ما اكتمل دون تعقيد.</p><div className="app-keywords"><span>مهام اليوم والمهام القادمة</span><span>عداد للتأخير والتقدّم</span><span>أرشيف للمهام المكتملة</span></div></div>
          <JourneyAccess compact />
        </div>
      </section>

      <Newsletter />
    </PageFrame>
  );
}
