import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageFrame } from "@/components/site-chrome";
import { supabase } from "@/lib/supabaseClient";
import MarkdownContent from "../MarkdownContent";

export const dynamic = "force-dynamic";

export default async function DynamicArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: article, error } = await supabase
    .from("articles")
    .select("id, title, description, content, image_url, is_published, created_at")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !article) {
    notFound();
  }

  return (
    <PageFrame>
      <article className="article-page shell">
        <Link className="back-link" href="/articles">
          <ArrowRight size={17} /> جميع المقالات
        </Link>

        <header>
          <span>
            {new Date(article.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <h1>{article.title}</h1>
          {article.description && <p>{article.description}</p>}
        </header>

        {article.image_url && (
          <div className="article-hero">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 1200px"
              unoptimized
            />
          </div>
        )}

        <div className="article-body">
          <MarkdownContent content={article.content ?? ""} />
        </div>
      </article>
    </PageFrame>
  );
}
