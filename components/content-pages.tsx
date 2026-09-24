import Link from "next/link";
import { ArrowLeft, Headphones, Mail, Play } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import LikeButton from "@/app/articles/LikeButton";

export function PageIntro({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <header className="page-intro shell"><span>{kicker}</span><h1>{title}</h1><p>{description}</p></header>;
}

type DbArticleSummary = {
  id: string | number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  date: string;
};

export function ArticlesPage({
  articles = [],
  likeCounts = {},
}: {
  articles?: DbArticleSummary[];
  likeCounts?: Record<number, number>;
}) {
  return <PageFrame><PageIntro kicker="المقالات" title="أفكار تساعدك على التقدّم" description="نكتب عن الاستمرارية، تنظيم الوقت، وبناء إنجازات صغيرة يمكن رؤيتها والاحتفاء بها." />
    <section className="listing-grid shell">
      <Link className="editorial-card editorial-card-main" href="/articles/small-steps"><div className="editorial-card-image"><img src="/article-small-steps.webp" alt="طالب يبدأ طريقه عبر الكتب والخطوات الصغيرة" /></div><span>رحلة الإنجاز · 7 دقائق</span><h2>لماذا تبدأ الإنجازات الكبيرة بخطوة صغيرة؟</h2><p>كيف نصنع نظامًا يحترم طاقتنا ويقودنا بهدوء إلى ما نريد؟</p><b>اقرأ المقال <ArrowLeft size={18} /></b></Link>
      {articles.map((article) => (
        <Link className="editorial-card" href={`/articles/${article.id}`} key={article.id}>
          {article.imageUrl && <div className="editorial-card-image"><img src={article.imageUrl} alt={article.title} /></div>}
          <span>{article.date}</span>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
          <div className="editorial-card-actions">
            <b>اقرأ المقال <ArrowLeft size={18} /></b>
            <LikeButton contentType="article" contentId={Number(article.id)} initialCount={likeCounts[Number(article.id)] ?? 0} />
          </div>
        </Link>
      ))}
      <article className="editorial-card"><div className="editorial-card-image"><img src="/article-consistency.webp" alt="شخص يصعد درجات ثابتة في رحلة طويلة" /></div><span>قريبًا</span><h2>الاستمرارية أقوى من الحماس</h2><p>عن بناء عادات لا تعتمد على المزاج أو البدايات المثالية.</p></article>
      <article className="editorial-card"><div className="editorial-card-image"><img src="/article-record.webp" alt="يد توثّق الإنجازات الصغيرة على لوحة" /></div><span>قريبًا</span><h2>كيف ترى إنجازك قبل أن تنساه؟</h2><p>طريقة بسيطة لتوثيق الخطوات الصغيرة والعودة إليها.</p></article>
    </section>
  </PageFrame>;
}

type DbEpisodeSummary = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  date: string;
};

export function PodcastPage({
  episodes = [],
  likeCounts = {},
}: {
  episodes?: DbEpisodeSummary[];
  likeCounts?: Record<number, number>;
}) {
  const [latest, ...rest] = episodes;
  return <PageFrame><PageIntro kicker="بودكاست خُطوة" title="حديث هادئ عن الاستمرار" description="حلقات قصيرة وعملية تساعدك على تجاوز التعثر والعودة إلى خطوتك التالية." />
    <section className="episode-catalog shell">
      {episodes.length === 0 && <p style={{ padding: "40px 0", color: "var(--muted)" }}>لا توجد حلقات منشورة بعد.</p>}
      {latest && (
        <Link href={`/podcast/${latest.id}`}>
          <article className="episode-feature">
            <div className="catalog-podcast-image">
              {latest.imageUrl && <img src={latest.imageUrl} alt={latest.title} />}
              <span><Headphones size={18} /> بودكاست خُطوة</span>
            </div>
            <div>
              <span className="content-tag">{latest.date}</span>
              <h2>{latest.title}</h2>
              {latest.description && <p>{latest.description}</p>}
              <div className="editorial-card-actions">
                <button className="play-button"><Play size={18} fill="currentColor" /> استمع الآن</button>
                <LikeButton contentType="podcast" contentId={latest.id} initialCount={likeCounts[latest.id] ?? 0} />
              </div>
            </div>
          </article>
        </Link>
      )}
      {rest.map((episode, i) => (
        <Link href={`/podcast/${episode.id}`} key={episode.id}>
          <article className="episode-row">
            {episode.imageUrl && <img className="episode-row-image" src={episode.imageUrl} alt={episode.title} />}
            <b>{String(i + 2).padStart(2, "0")}</b>
            <div>
              <span>{episode.date}</span>
              <h3>{episode.title}</h3>
              <LikeButton contentType="podcast" contentId={episode.id} initialCount={likeCounts[episode.id] ?? 0} />
            </div>
            <Play size={18} />
          </article>
        </Link>
      ))}
    </section>
  </PageFrame>;
}

type DbNewsSummary = {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  date: string;
};

export function NewsPage({
  news = [],
  likeCounts = {},
}: {
  news?: DbNewsSummary[];
  likeCounts?: Record<number, number>;
}) {
  return <PageFrame><PageIntro kicker="الأخبار" title="ما يحدث في رحلة مُنجِز" description="آخر تحديثات المنصة والمنتجات والمحتوى الجديد." />
    <section className="news-list shell">
      {news.length === 0 && <p style={{ padding: "40px 0", color: "var(--muted)" }}>لا توجد أخبار منشورة بعد.</p>}
      {news.map((item) => (
        <Link className="news-list-link" href={`/news/${item.id}`} key={item.id}>
          <article>
            <time>{item.date}</time>
            {item.imageUrl && <img className="news-list-image" src={item.imageUrl} alt={item.title} />}
            <div>
              <h2>{item.title}</h2>
              <p>{item.excerpt}</p>
              <div className="editorial-card-actions">
                <LikeButton contentType="news" contentId={item.id} initialCount={likeCounts[item.id] ?? 0} />
              </div>
            </div>
          </article>
        </Link>
      ))}
    </section>
  </PageFrame>;
}

export function StorePage() {
  return <PageFrame><PageIntro kicker="المتجر" title="أدوات تجعل الإنجاز ملموسًا" description="منتجات صُممت لترافق رحلتك اليومية. المتجر قيد التجهيز وسيُفتح قريبًا." />
    <section className="store-grid store-page-grid shell"><article className="product-card"><div className="product-visual notebook"><span>رحلة مُنجِز</span><small>دفتر الإنجازات الصغيرة</small></div><div className="product-meta"><div><h3>دفتر الإنجازات الصغيرة</h3><p>تخطيط أسبوعي بلا تعقيد</p></div><strong>قريبًا</strong></div></article><article className="product-card"><div className="product-visual cards"><span>52</span><small>بطاقة لفكرة كل أسبوع</small></div><div className="product-meta"><div><h3>بطاقات خُطوة</h3><p>أسئلة تساعدك على البدء</p></div><strong>قريبًا</strong></div></article></section>
  </PageFrame>;
}

export function ContactPage() {
  const contacts = [
    ["مرحبًا وتعاون", "hello@munjez-journey.com", "للشراكات والاقتراحات والرسائل العامة."],
    ["المعلومات والإعلام", "info@munjez-journey.com", "للاستفسارات الرسمية والمعلومات الإعلامية."],
    ["الدعم", "support@munjez-journey.com", "للمساعدة المتعلقة بالحساب أو استخدام المنصة."],
  ];
  return <PageFrame><PageIntro kicker="تواصل معنا" title="نسمع منك" description="اختر البريد الأقرب إلى موضوع رسالتك وسنرد عليك في أقرب وقت ممكن." /><section className="contact-grid shell">{contacts.map(([title,email,desc]) => <a href={`mailto:${email}`} key={email}><Mail size={24} /><h2>{title}</h2><p>{desc}</p><b dir="ltr">{email}</b></a>)}</section></PageFrame>;
}

export function AboutPage() {
  return <PageFrame><PageIntro kicker="عن المشروع" title="رحلة تبدأ بخطوة صغيرة" description="رحلة مُنجِز مشروع عربي يساعد الإنسان على تنظيم حياته ورؤية تقدّمه والاحتفاء بما ينجزه." /><article className="prose-page shell"><h2>لماذا رحلة مُنجِز؟</h2><p>بدأت الفكرة من حاجة بسيطة: أداة عربية واضحة لا تزيد ضجيج يومنا، بل تجعل ما نريد إنجازه أقرب وأسهل في المتابعة.</p><h2>ما نؤمن به</h2><p>الاستمرارية أقوى من الحماس، وكل إنجاز يستحق أن يُرى ويوثّق ويُحتفى به، والإنسان العربي يستحق أداة مصممة له من الأصل.</p></article></PageFrame>;
}

export function FaqPage() {
  const qs = [["ما هي رحلة مُنجِز؟","منصة عربية تجمع المحتوى والأدوات التي تساعدك على تحويل الخطوات الصغيرة إلى إنجازات."],["هل التطبيق متاح الآن؟","النسخة الأولى قيد التطوير، وسيتم إعلان الإطلاق عبر الموقع وحساباتنا الرسمية."],["كيف أتواصل مع الدعم؟","راسل support@munjez-journey.com وسنساعدك."],["متى يفتح المتجر؟","المتجر قيد التجهيز، ويمكن متابعة الأخبار لمعرفة موعد الإطلاق."]];
  return <PageFrame><PageIntro kicker="الأسئلة الشائعة" title="إجابات مختصرة" description="أكثر الأسئلة التي قد تحتاجها قبل بدء رحلتك." /><section className="faq-list shell">{qs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section></PageFrame>;
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <PageFrame><PageIntro kicker="قانوني" title={title} description={`آخر تحديث: ${updated}`} /><article className="prose-page legal-copy shell">{children}<h2>التواصل</h2><p>لأي استفسار متعلق بهذه السياسة، راسلنا على <a href="mailto:info@munjez-journey.com">info@munjez-journey.com</a>.</p></article></PageFrame>;
}
