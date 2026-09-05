import Link from "next/link";
import { ArrowLeft, Headphones, Mail, Play } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";

export function PageIntro({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <header className="page-intro shell"><span>{kicker}</span><h1>{title}</h1><p>{description}</p></header>;
}

export function ArticlesPage() {
  return <PageFrame><PageIntro kicker="المقالات" title="أفكار تساعدك على التقدّم" description="نكتب عن الاستمرارية، تنظيم الوقت، وبناء إنجازات صغيرة يمكن رؤيتها والاحتفاء بها." />
    <section className="listing-grid shell">
      <Link className="editorial-card editorial-card-main" href="/articles/small-steps"><div className="editorial-card-image"><img src="/article-small-steps.webp" alt="طالب يبدأ طريقه عبر الكتب والخطوات الصغيرة" /></div><span>رحلة الإنجاز · 7 دقائق</span><h2>لماذا تبدأ الإنجازات الكبيرة بخطوة صغيرة؟</h2><p>كيف نصنع نظامًا يحترم طاقتنا ويقودنا بهدوء إلى ما نريد؟</p><b>اقرأ المقال <ArrowLeft size={18} /></b></Link>
      <article className="editorial-card"><div className="editorial-card-image"><img src="/article-consistency.webp" alt="شخص يصعد درجات ثابتة في رحلة طويلة" /></div><span>قريبًا</span><h2>الاستمرارية أقوى من الحماس</h2><p>عن بناء عادات لا تعتمد على المزاج أو البدايات المثالية.</p></article>
      <article className="editorial-card"><div className="editorial-card-image"><img src="/article-record.webp" alt="يد توثّق الإنجازات الصغيرة على لوحة" /></div><span>قريبًا</span><h2>كيف ترى إنجازك قبل أن تنساه؟</h2><p>طريقة بسيطة لتوثيق الخطوات الصغيرة والعودة إليها.</p></article>
    </section>
  </PageFrame>;
}

export function PodcastPage() {
  return <PageFrame><PageIntro kicker="بودكاست خُطوة" title="حديث هادئ عن الاستمرار" description="حلقات قصيرة وعملية تساعدك على تجاوز التعثر والعودة إلى خطوتك التالية." />
    <section className="episode-catalog shell">
      <article className="episode-feature"><div className="catalog-podcast-image"><img src="/podcast-motivation.webp" alt="جرافيك لمسار يستمر بعد اختفاء دفعة الحماس" /><span><Headphones size={18} /> بودكاست خُطوة</span></div><div><span className="content-tag">الحلقة 01</span><h2>كيف نستمر حين يختفي الحماس؟</h2><p>حديث عن العادات والتوقعات الواقعية، ولماذا لا نحتاج إلى يوم مثالي كي نتقدم.</p><button className="play-button"><Play size={18} fill="currentColor" /> استمع الآن <span>32:18</span></button></div></article>
      {[
        ["بين التخطيط والتنفيذ", "/podcast-plan-action.webp", "جرافيك لشبكة تخطيط تتحول إلى درجات"],
        ["إنجاز يناسب حياتك", "/podcast-real-life.webp", "جرافيك لأشكال مرنة تستقر في إيقاع يومي"],
        ["ماذا نفعل بعد التعثر؟", "/podcast-restart.webp", "يد تعيد قطعة إلى مسار متصل"],
      ].map(([title, image, alt], i) => <article className="episode-row" key={title}><img className="episode-row-image" src={image} alt={alt} /><b>{String(i + 2).padStart(2,"0")}</b><div><span>قريبًا</span><h3>{title}</h3></div><Play size={18} /></article>)}
    </section>
  </PageFrame>;
}

export function NewsPage() {
  return <PageFrame><PageIntro kicker="الأخبار" title="ما يحدث في رحلة مُنجِز" description="آخر تحديثات المنصة والمنتجات والمحتوى الجديد." />
    <section className="news-list shell">
      <article><time>1 سبتمبر 2026</time><img className="news-list-image" src="/news-app-launch.webp" alt="جرافيك أبيض وأسود لمساحة إدارة المهام" /><div><span>المنصة</span><h2>نطلق النسخة الأولى من مساحة متابعة الإنجاز</h2><p>تجربة عربية تجمع مهام اليوم، التقويم، والأهداف في مكان واحد.</p></div></article>
      <article><time>28 أغسطس 2026</time><img className="news-list-image" src="/news-notebook.webp" alt="دفتر تخطيط بلون كريمي على مكتب" /><div><span>المتجر</span><h2>دفتر الإنجازات الصغيرة متاح قريبًا</h2><p>منتج عملي لتخطيط أسبوع واضح بلا تعقيد.</p></div></article>
      <article><time>24 أغسطس 2026</time><img className="news-list-image" src="/news-newsletter.webp" alt="رسالة ورقية وتقويم أسبوعي صغير" /><div><span>النشرة</span><h2>رسالة أسبوعية تعيد ترتيب أولوياتك</h2><p>مقال وفكرة وخطوة عملية تصل إلى بريدك.</p></div></article>
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
