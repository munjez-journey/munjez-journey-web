"use client";

import SiteSettingsForm, { GroupConfig } from "@/app/admin/_components/SiteSettingsForm";

const GROUPS: GroupConfig[] = [
  {
    title: "الرئيسية — قسم الفلسفة",
    fields: [
      {
        key: "home_hero_title",
        label: "العنوان (سطر جديد = فاصل سطر في العرض)",
        textarea: true,
        placeholder: "وما النجاح إلا\nإنجازات صغيرة.",
      },
      {
        key: "home_hero_side_text",
        label: "النص الجانبي",
        textarea: true,
        placeholder: "نكتب ونصنع أدوات تساعدك على التقدّم بهدوء، خطوة بعد خطوة.",
      },
    ],
  },
  {
    title: "الرئيسية — قسم المنصة",
    fields: [
      { key: "platform_badge", label: "الشارة", placeholder: "تجربة أولية — التطبيق الكامل قريباً" },
      { key: "platform_title", label: "العنوان", placeholder: "مهامك اليومية، في مكان واضح" },
      {
        key: "platform_description",
        label: "الوصف",
        textarea: true,
        placeholder: "مساحة عربية مخصصة لإدارة المهام فقط: أضف ما تريد إنجازه، رتّب يومك، وتابع ما اكتمل دون تعقيد.",
      },
      { key: "platform_point_1", label: "النقطة الأولى", placeholder: "مهام اليوم والمهام القادمة" },
      { key: "platform_point_2", label: "النقطة الثانية", placeholder: "عداد للتأخير والتقدّم" },
      { key: "platform_point_3", label: "النقطة الثالثة", placeholder: "أرشيف للمهام المكتملة" },
      {
        key: "journey_button_label",
        label: 'نص زر "إدارة المهام" (مشترك في كل الموقع)',
        placeholder: "إدارة المهام",
      },
    ],
  },
  {
    title: "صفحة المقالات — hero",
    fields: [
      { key: "articles_hero_title", label: "العنوان", placeholder: "أفكار تساعدك على التقدّم" },
      {
        key: "articles_hero_description",
        label: "النص",
        textarea: true,
        placeholder: "نكتب عن الاستمرارية، تنظيم الوقت، وبناء إنجازات صغيرة يمكن رؤيتها والاحتفاء بها.",
      },
    ],
  },
  {
    title: "صفحة أبطال الرحلة — hero",
    fields: [
      { key: "champions_hero_title", label: "العنوان", placeholder: "أشخاص عاديون، رحلات تستحق أن تُروى" },
      {
        key: "champions_hero_description",
        label: "النص",
        textarea: true,
        placeholder: "نشارك تجارب أشخاص لم يبدأوا بظروف مثالية، لكنهم وجدوا خطوتهم التالية واستمروا.",
      },
    ],
  },
  {
    title: "صفحة البودكاست — hero",
    fields: [
      { key: "podcast_hero_title", label: "العنوان", placeholder: "حديث هادئ عن الاستمرار" },
      {
        key: "podcast_hero_description",
        label: "النص",
        textarea: true,
        placeholder: "حلقات قصيرة وعملية تساعدك على تجاوز التعثر والعودة إلى خطوتك التالية.",
      },
    ],
  },
  {
    title: "صفحة الأخبار — hero",
    fields: [
      { key: "news_hero_title", label: "العنوان", placeholder: "ما يحدث في رحلة مُنجِز" },
      {
        key: "news_hero_description",
        label: "النص",
        textarea: true,
        placeholder: "آخر تحديثات المنصة والمنتجات والمحتوى الجديد.",
      },
    ],
  },
  {
    title: "صفحة المتجر — hero",
    fields: [
      { key: "store_title", label: "العنوان", placeholder: "أدوات تجعل الإنجاز ملموسًا" },
      {
        key: "store_empty_text",
        label: "النص عند عدم وجود منتجات",
        textarea: true,
        placeholder: "منتجات صُممت لترافق رحلتك اليومية. المتجر قيد التجهيز وسيُفتح قريباً.",
      },
    ],
  },
];

export default function AdminHomePage() {
  return <SiteSettingsForm pageTitle="نصوص الصفحات الثابتة" groups={GROUPS} />;
}
