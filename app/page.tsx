"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Headphones, Play, ShoppingBag } from "lucide-react";
import { JourneyAccess, Newsletter, PageFrame } from "@/components/site-chrome";

export default function Home() {
  return (
    <PageFrame>
      <section className="feature shell" aria-labelledby="feature-title">
        <Link className="feature-image" href="/articles/small-steps" aria-label="قراءة المقال المميز">
          <Image src="/article-small-steps.webp" alt="رسم لطالب يبدأ طريقه عبر الكتب والخطوات الصغيرة" fill sizes="(max-width: 800px) 100vw, 58vw" priority unoptimized />
          <span className="image-label">مقال الأسبوع</span>
        </Link>
        <article className="feature-copy">
          <div className="eyebrow"><span>رحلة الإنجاز</span><span>7 دقائق قراءة</span></div>
          <h1 id="feature-title">لماذا تبدأ الإنجازات الكبيرة بخطوة صغيرة؟</h1>
          <p className="feature-lead">لا تتشكل الرحلات المهمة من قفزة واحدة، بل من أفعال صغيرة تتكرر حتى يصبح أثرها واضحًا. كيف نصنع نظامًا يحترم طاقتنا ويقودنا إلى ما نريد؟</p>
          <div className="article-meta">
            <div><strong>فريق رحلة مُنجِز</strong><span>1 سبتمبر 2026</span></div>
            <Link href="/articles/small-steps">اقرأ المقال <ArrowLeft size={18} /></Link>
          </div>
        </article>
      </section>

      <section className="manifesto shell" aria-label="فلسفة رحلة منجز">
        <p>رحلة مُنجِز</p><h2>وما النجاح إلا<br />إنجازات صغيرة.</h2>
        <p className="manifesto-note">نكتب ونصنع أدوات تساعدك على التقدّم بهدوء، خطوة بعد خطوة.</p>
      </section>

      <section className="section champions-preview shell">
        <div className="section-heading"><div><span className="section-number">01</span><h2>أبطال الرحلة</h2></div><Link href="/champions">جميع القصص <ArrowUpLeft size={16} /></Link></div>
        <Link className="champion-feature" href="/champions/omar">
          <div className="champion-image"><img src="/journey-hero-omar.png" alt="رسم تحريري لطالب يكتب خطته اليومية" /></div>
          <div><span className="content-tag">بطل الرحلة لهذا الشهر</span><h3>عمر: سنة كاملة من المحاولات الصغيرة</h3><p>طالب يعمل نهارًا ويدرس ليلًا. لم ينتظر الظروف المثالية؛ بدأ بعشرين دقيقة كل يوم، ثم شارك تجربته معنا.</p><b>اقرأ قصة عمر <ArrowLeft size={18} /></b></div>
        </Link>
      </section>

      <section className="section shell" id="podcast">
        <div className="section-heading"><div><span className="section-number">02</span><h2>استمع</h2></div><Link href="/podcast">جميع الحلقات <ArrowUpLeft size={16} /></Link></div>
        <div className="podcast-grid">
          <article className="podcast-main">
            <div className="podcast-art podcast-art-photo"><img src="/podcast-motivation.webp" alt="جرافيك لمسار يستمر بعد اختفاء دفعة الحماس" /><span>بودكاست خُطوة</span><Headphones size={30} strokeWidth={1.35} /></div>
            <div className="podcast-info"><span className="content-tag">الحلقة 01</span><h3>كيف نستمر حين يختفي الحماس؟</h3><p>حديث هادئ عن العادات، التوقعات الواقعية، ولماذا لا نحتاج إلى يوم مثالي كي نتقدم.</p><Link className="play-button" href="/podcast"><Play size={18} fill="currentColor" /> استمع الآن <span>32:18</span></Link></div>
          </article>
          <div className="episode-list">
            <Link href="/podcast"><img src="/podcast-plan-action.webp" alt="" /><span>02</span><div><small>قريبًا</small><strong>بين التخطيط والتنفيذ</strong></div><Play size={17} /></Link>
            <Link href="/podcast"><img src="/podcast-real-life.webp" alt="" /><span>03</span><div><small>قريبًا</small><strong>إنجاز يناسب حياتك</strong></div><Play size={17} /></Link>
            <Link href="/podcast"><img src="/podcast-restart.webp" alt="" /><span>04</span><div><small>قريبًا</small><strong>ماذا نفعل بعد التعثر؟</strong></div><Play size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section news-section shell" id="news">
        <div className="section-heading"><div><span className="section-number">03</span><h2>آخر الأخبار</h2></div><Link href="/news">المزيد <ArrowUpLeft size={16} /></Link></div>
        <div className="news-grid">
          <article className="news-card featured-news"><img className="news-card-image" src="/news-app-launch.webp" alt="جرافيك أبيض وأسود لمساحة إدارة المهام" /><span className="content-tag">من رحلة مُنجِز</span><h3>نطلق النسخة الأولى من مساحة متابعة الإنجاز</h3><p>تجربة عربية بسيطة تجمع مهام اليوم، التقويم، والأهداف في مكان واحد.</p><time>1 سبتمبر 2026</time></article>
          <article className="news-card"><img className="news-card-image" src="/news-notebook.webp" alt="دفتر الإنجازات الصغيرة" /><span className="content-tag">المتجر</span><h3>دفتر الإنجازات الصغيرة متاح قريبًا</h3><time>28 أغسطس 2026</time></article>
          <article className="news-card"><img className="news-card-image" src="/news-newsletter.webp" alt="رسالة أسبوعية وتقويم صغير" /><span className="content-tag">النشرة</span><h3>رسالة أسبوعية واحدة تعيد ترتيب أولوياتك</h3><time>24 أغسطس 2026</time></article>
        </div>
      </section>

      <section className="section shell" id="store">
        <div className="section-heading"><div><span className="section-number">04</span><h2>من المتجر</h2></div><Link href="/store">زيارة المتجر <ShoppingBag size={16} /></Link></div>
        <div className="store-grid">
          <article className="product-card"><div className="product-visual notebook"><span>رحلة مُنجِز</span><small>دفتر الإنجازات الصغيرة</small></div><div className="product-meta"><div><h3>دفتر الإنجازات الصغيرة</h3><p>تخطيط أسبوعي بلا تعقيد</p></div><strong>قريبًا</strong></div></article>
          <article className="product-card"><div className="product-visual cards"><span>52</span><small>بطاقة لفكرة كل أسبوع</small></div><div className="product-meta"><div><h3>بطاقات خُطوة</h3><p>أسئلة تساعدك على البدء</p></div><strong>قريبًا</strong></div></article>
        </div>
      </section>

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
