export type FieldConfig =
  | {
      name: string;
      label: string;
      type: "text";
      dir?: "ltr" | "rtl";
      required?: boolean;
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: "textarea";
      required?: boolean;
      rows?: number;
      hint?: string;
    }
  | { name: string; label: string; type: "number"; required?: boolean }
  | { name: string; label: string; type: "checkbox" }
  | { name: string; label: string; type: "image" };

export type SectionConfig = {
  key: string;
  table: string;
  basePath: string;
  label: string;
  singularLabel: string;
  addLabel: string;
  titleField: string;
  fields: FieldConfig[];
};

export const sections: Record<string, SectionConfig> = {
  articles: {
    key: "articles",
    table: "articles",
    basePath: "/admin/articles",
    label: "المقالات",
    singularLabel: "مقال",
    addLabel: "إضافة مقال جديد",
    titleField: "title",
    fields: [
      { name: "title", label: "العنوان", type: "text", required: true },
      {
        name: "author",
        label: "الكاتب",
        type: "text",
        hint: "اتركه فارغاً لاستخدام \"فريق رحلة مُنجِز\" تلقائياً.",
      },
      {
        name: "description",
        label: "الوصف / المقدمة",
        type: "textarea",
        rows: 3,
        hint: "يظهر بخط كبير تحت العنوان الرئيسي مباشرة في صفحة المقال.",
      },
      {
        name: "content",
        label: "المحتوى",
        type: "textarea",
        required: true,
        rows: 10,
        hint: "يدعم صيغة Markdown: ## لعنوان فرعي، **عريض** للنص العريض، > للاقتباس، واترك سطراً فارغاً بين الفقرات. تجنّب استخدام ### لأنه غير منسّق في الموقع.",
      },
      { name: "image_url", label: "الصورة", type: "image" },
      { name: "is_published", label: "نشر المقال؟", type: "checkbox" },
    ],
  },
  podcast: {
    key: "podcast",
    table: "podcast_episodes",
    basePath: "/admin/podcast",
    label: "البودكاست",
    singularLabel: "حلقة",
    addLabel: "إضافة حلقة جديدة",
    titleField: "title",
    fields: [
      { name: "title", label: "عنوان الحلقة", type: "text", required: true },
      {
        name: "description",
        label: "الوصف",
        type: "textarea",
        required: true,
        rows: 6,
      },
      { name: "audio_url", label: "رابط الصوت", type: "text", dir: "ltr" },
      { name: "image_url", label: "الصورة", type: "image" },
      { name: "is_published", label: "نشر الحلقة؟", type: "checkbox" },
    ],
  },
  news: {
    key: "news",
    table: "news",
    basePath: "/admin/news",
    label: "الأخبار",
    singularLabel: "خبر",
    addLabel: "إضافة خبر جديد",
    titleField: "title",
    fields: [
      { name: "title", label: "العنوان", type: "text", required: true },
      {
        name: "content",
        label: "المحتوى",
        type: "textarea",
        required: true,
        rows: 10,
      },
      { name: "image_url", label: "الصورة", type: "image" },
      { name: "is_published", label: "نشر الخبر؟", type: "checkbox" },
    ],
  },
  store: {
    key: "store",
    table: "store_products",
    basePath: "/admin/store",
    label: "المتجر",
    singularLabel: "منتج",
    addLabel: "إضافة منتج جديد",
    titleField: "name",
    fields: [
      { name: "name", label: "اسم المنتج", type: "text", required: true },
      {
        name: "description",
        label: "الوصف",
        type: "textarea",
        required: true,
        rows: 6,
      },
      { name: "price", label: "السعر", type: "number", required: true },
      { name: "image_url", label: "الصورة", type: "image" },
      { name: "is_published", label: "نشر المنتج؟", type: "checkbox" },
    ],
  },
  champions: {
    key: "champions",
    table: "champions",
    basePath: "/admin/champions",
    label: "أبطال الرحلة",
    singularLabel: "بطل",
    addLabel: "إضافة بطل جديد",
    titleField: "name",
    fields: [
      { name: "name", label: "الاسم", type: "text", required: true },
      { name: "slug", label: "الرابط (slug)", type: "text", dir: "ltr", required: true },
      { name: "tag", label: "الوسم", type: "text" },
      {
        name: "short_description",
        label: "وصف قصير",
        type: "textarea",
        required: true,
        rows: 4,
      },
      {
        name: "story_content",
        label: "نص القصة الكاملة",
        type: "textarea",
        required: true,
        rows: 10,
      },
      { name: "image_url", label: "الصورة", type: "image" },
      { name: "is_published", label: "نشر القصة؟", type: "checkbox" },
    ],
  },
};
