"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, Mail, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { OptionalSignIn } from "@/components/account-access";
import { createUserClient } from "@/lib/supabase/userClient";
import { subscribeToNewsletter } from "@/app/actions/newsletter";

type SocialLinks = { x: string; instagram: string; linkedin: string; tiktok: string };

// احتياطي يُستخدم فقط إن فشل الاستعلام تماماً (مثل غياب الجدول نفسه)،
// وليس لتعويض قيمة فارغة مقصودة في قاعدة البيانات — قيمة فارغة تعني
// إخفاء الأيقونة، لا استبدالها برابط افتراضي.
const FALLBACK_SOCIAL_LINKS: SocialLinks = {
  x: "https://x.com/munjez_journey",
  instagram: "https://www.instagram.com/munjez_journey/",
  linkedin: "https://www.linkedin.com/company/munjez-journey/",
  tiktok: "https://www.tiktok.com/@munjez_journey",
};

function useSocialLinks(): SocialLinks | null {
  const [links, setLinks] = useState<SocialLinks | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createUserClient();

    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["social_x", "social_instagram", "social_linkedin", "social_tiktok"])
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error || !data) {
          setLinks(FALLBACK_SOCIAL_LINKS);
          return;
        }

        const map: Record<string, string> = {};
        for (const row of data) {
          map[row.key as string] = (row.value as string) ?? "";
        }
        setLinks({
          x: map.social_x ?? "",
          instagram: map.social_instagram ?? "",
          linkedin: map.social_linkedin ?? "",
          tiktok: map.social_tiktok ?? "",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}

const navItems = [
  ["الرئيسية", "/"],
  ["المقالات", "/articles"],
  ["أبطال الرحلة", "/champions"],
  ["البودكاست", "/podcast"],
  ["الأخبار", "/news"],
  ["المتجر", "/store"],
] as const;

export function HourglassMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={compact ? "hourglass-mark compact" : "hourglass-mark"} href="/" aria-label="العودة إلى الصفحة الرئيسية">
      <img src="/hourglass-logo.png" alt="شعار رحلة مُنجِز" width="72" height="94" />
    </Link>
  );
}

const JOURNEY_BUTTON_LABEL_FALLBACK = "إدارة المهام";

function useJourneyButtonLabel(): string {
  const [label, setLabel] = useState(JOURNEY_BUTTON_LABEL_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const supabase = createUserClient();

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "journey_button_label")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.value) return;
        setLabel(data.value as string);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return label;
}

export function JourneyAccess({ compact = false }: { compact?: boolean }) {
  const label = useJourneyButtonLabel();
  return (
    <Link className={compact ? "journey-button compact-button" : "journey-button"} href="/tasks">
      {label}
      {!compact && <ArrowUpLeft size={17} strokeWidth={1.8} />}
    </Link>
  );
}

function SocialIcon({ name }: { name: "x" | "instagram" | "linkedin" | "tiktok" }) {
  const paths = {
    x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.967 6.817H1.68l7.733-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z",
    instagram: "M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5Zm8.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0-6Z",
    linkedin: "M5.25 3.5A2.25 2.25 0 1 1 .75 3.5a2.25 2.25 0 0 1 4.5 0ZM1 8h4.5v14H1V8Zm7.25 0h4.31v1.91h.06c.6-1.14 2.07-2.34 4.26-2.34 4.55 0 5.39 3 5.39 6.89V22h-4.5v-6.68c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.74-2.56 3.53V22h-4.5V8Z",
    tiktok: "M16.6 2c.35 2.14 1.54 3.42 3.65 3.56v3.78a8.28 8.28 0 0 1-3.61-.84v7.16A6.34 6.34 0 1 1 11.17 9.4v3.83a2.62 2.62 0 1 0 1.72 2.46V2h3.71Z",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="masthead shell">
        <div className="masthead-side masthead-right"><HourglassMark /></div>
        <Link className="wordmark" href="/">رحـلـة مُـنـجِـز</Link>
        <div className="masthead-side masthead-left">
          <Link className="icon-button" href="/articles" aria-label="البحث في المحتوى"><Search size={20} /></Link>
          <OptionalSignIn />
          <JourneyAccess />
        </div>
      </div>
      <nav className="main-nav shell" aria-label="التنقل الرئيسي">
        <div className="nav-links">
          {navItems.map(([label, href]) => (
            <Link className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""} href={href} key={label}>{label}</Link>
          ))}
        </div>
        <span className="issue-date">الإصدار الأول · سبتمبر 2026</span>
      </nav>
    </header>
  );
}

type NewsletterStatus = "idle" | "submitting" | "success" | "error";

export function Newsletter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [status, setStatus] = useState<NewsletterStatus>("idle");

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: { name?: string; email?: string } = {};
    if (!name.trim()) nextErrors.name = "الاسم مطلوب";
    if (!email.trim()) {
      nextErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "صيغة البريد الإلكتروني غير صحيحة";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    const result = await subscribeToNewsletter(name.trim(), email.trim());

    if (!result.ok) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setName("");
    setEmail("");
  }

  if (status === "success") {
    return (
      <section className="newsletter shell">
        <div><Mail size={22} /><h2>رسالة صغيرة كل أسبوع</h2></div>
        <p className="newsletter-success">تم. أنت الآن ضمن الرسالة الأسبوعية.</p>
      </section>
    );
  }

  return (
    <section className="newsletter shell">
      <div><Mail size={22} /><h2>رسالة صغيرة كل أسبوع</h2></div>
      <p>مقال، فكرة، وخطوة عملية تصل إلى بريدك دون ضجيج.</p>
      <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
        <div className="newsletter-fields">
          <div className="newsletter-field">
            <input
              type="text"
              placeholder="الاسم الأول"
              aria-label="الاسم الأول"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={status === "submitting"}
            />
            {errors.name && <span className="newsletter-error">{errors.name}</span>}
          </div>
          <div className="newsletter-field">
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              aria-label="البريد الإلكتروني"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === "submitting"}
            />
            {errors.email && <span className="newsletter-error">{errors.email}</span>}
          </div>
        </div>
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "جارٍ الاشتراك…" : "اشترك"}
        </button>
      </form>
      {status === "error" && (
        <span className="newsletter-error newsletter-error-general">
          تعذّر إتمام الاشتراك، حاول مرة أخرى.
        </span>
      )}
    </section>
  );
}

export function SiteFooter() {
  const social = useSocialLinks();
  return (
    <footer className="site-footer">
      <div className="shell footer-top">
        <div className="footer-column"><strong>اكتشف</strong><Link href="/articles">المقالات</Link><Link href="/champions">أبطال الرحلة</Link><Link href="/podcast">البودكاست</Link><Link href="/news">الأخبار</Link><Link href="/store">المتجر</Link></div>
        <div className="footer-column"><strong>رحلة مُنجِز</strong><Link href="/#app">التطبيق</Link><Link href="/about">عن المشروع</Link><Link href="/contact">تواصل معنا</Link><Link href="/faq">الأسئلة الشائعة</Link></div>
        <div className="footer-column"><strong>قانوني</strong><Link href="/privacy">سياسة الخصوصية</Link><Link href="/terms">الشروط والأحكام</Link><Link href="/cookies">سياسة ملفات الارتباط</Link><Link href="/content-policy">سياسة المحتوى</Link></div>
        <div className="footer-social"><strong>تابع الرحلة</strong><div>
          {social?.x && <a href={social.x} aria-label="X"><SocialIcon name="x" /></a>}
          {social?.instagram && <a href={social.instagram} aria-label="Instagram"><SocialIcon name="instagram" /></a>}
          {social?.linkedin && <a href={social.linkedin} aria-label="LinkedIn"><SocialIcon name="linkedin" /></a>}
          {social?.tiktok && <a href={social.tiktok} aria-label="TikTok"><SocialIcon name="tiktok" /></a>}
        </div></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} رحلة مُنجِز. جميع الحقوق محفوظة.</span></div>
    </footer>
  );
}

export function MunjezFooter() {
  const social = useSocialLinks();
  return (
    <footer className="site-footer munjez-footer">
      <div className="shell munjez-footer-row">
        <span className="munjez-copyright">© {new Date().getFullYear()} رحلة مُنجِز. جميع الحقوق محفوظة.</span>
        <div className="footer-social"><strong>تابع الرحلة</strong><div>
          {social?.x && <a href={social.x} aria-label="X"><SocialIcon name="x" /></a>}
          {social?.instagram && <a href={social.instagram} aria-label="Instagram"><SocialIcon name="instagram" /></a>}
          {social?.linkedin && <a href={social.linkedin} aria-label="LinkedIn"><SocialIcon name="linkedin" /></a>}
          {social?.tiktok && <a href={social.tiktok} aria-label="TikTok"><SocialIcon name="tiktok" /></a>}
        </div></div>
      </div>
    </footer>
  );
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  return <main id="top" dir="rtl"><SiteHeader />{children}<SiteFooter /></main>;
}
