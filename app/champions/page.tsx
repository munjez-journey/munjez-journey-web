import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import { PageIntro } from "@/components/content-pages";

export const metadata: Metadata = {
  title: "أبطال الرحلة | رحلة مُنجِز",
  description: "قصص حقيقية الطابع عن أشخاص عاديين واصلوا خطواتهم الصغيرة.",
};

export default function ChampionsPage() {
  return <PageFrame>
    <PageIntro kicker="أبطال الرحلة" title="أشخاص عاديون، رحلات تستحق أن تُروى" description="نشارك تجارب أشخاص لم يبدأوا بظروف مثالية، لكنهم وجدوا خطوتهم التالية واستمروا." />
    <section className="champions-list shell">
      <Link className="champion-feature" href="/champions/omar">
        <div className="champion-image"><img src="/journey-hero-omar.png" alt="رسم تحريري لطالب يكتب خطته اليومية" /></div>
        <div><span className="content-tag">بطل الرحلة لهذا الشهر</span><h2>عمر: سنة كاملة من المحاولات الصغيرة</h2><p>طالب جامعي يعمل نهارًا ويدرس ليلًا. شارك معنا كيف تحولت عشرون دقيقة يومية إلى عادة أعادت إليه ثقته بقدرته على الاستمرار.</p><b>اقرأ قصة عمر <ArrowLeft size={18} /></b></div>
      </Link>
    </section>
  </PageFrame>;
}
