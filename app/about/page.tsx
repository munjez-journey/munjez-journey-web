import type { Metadata } from "next";
import { AboutPage } from "@/components/content-pages";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = { title: "عن المشروع | رحلة مُنجِز", description: "قصة وفلسفة رحلة مُنجِز." };

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["about_heading_1", "about_paragraph_1", "about_heading_2", "about_paragraph_2"]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value) settings[row.key as string] = row.value as string;
  }

  return (
    <AboutPage
      heading1={settings.about_heading_1 ?? "لماذا رحلة مُنجِز؟"}
      paragraph1={
        settings.about_paragraph_1 ??
        "بدأت الفكرة من حاجة بسيطة: أداة عربية واضحة لا تزيد ضجيج يومنا، بل تجعل ما نريد إنجازه أقرب وأسهل في المتابعة."
      }
      heading2={settings.about_heading_2 ?? "ما نؤمن به"}
      paragraph2={
        settings.about_paragraph_2 ??
        "الاستمرارية أقوى من الحماس، وكل إنجاز يستحق أن يُرى ويوثّق ويُحتفى به، والإنسان العربي يستحق أداة مصممة له من الأصل."
      }
    />
  );
}
