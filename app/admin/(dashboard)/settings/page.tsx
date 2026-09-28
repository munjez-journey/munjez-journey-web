"use client";

import SiteSettingsForm, { GroupConfig } from "@/app/admin/_components/SiteSettingsForm";

const GROUPS: GroupConfig[] = [
  {
    title: "اسم ووصف الموقع",
    fields: [
      { key: "site_name", label: "اسم الموقع" },
      { key: "site_description", label: "الوصف التعريفي", textarea: true },
    ],
  },
  {
    title: "عناوين البريد الإلكتروني",
    fields: [
      { key: "contact_email_hello", label: "بريد التعاون والشراكات" },
      { key: "contact_email_info", label: "بريد المعلومات والإعلام" },
      { key: "contact_email_support", label: "بريد الدعم" },
    ],
  },
  {
    title: "روابط التواصل الاجتماعي",
    fields: [
      { key: "social_x", label: "X (تويتر)" },
      { key: "social_instagram", label: "Instagram" },
      { key: "social_linkedin", label: "LinkedIn" },
      { key: "social_tiktok", label: "TikTok" },
    ],
  },
  {
    title: "صفحة عن المشروع",
    fields: [
      { key: "about_heading_1", label: "عنوان القسم الأول" },
      { key: "about_paragraph_1", label: "فقرة القسم الأول", textarea: true },
      { key: "about_heading_2", label: "عنوان القسم الثاني" },
      { key: "about_paragraph_2", label: "فقرة القسم الثاني", textarea: true },
    ],
  },
];

export default function SettingsPage() {
  return <SiteSettingsForm pageTitle="الإعدادات العامة" groups={GROUPS} />;
}
