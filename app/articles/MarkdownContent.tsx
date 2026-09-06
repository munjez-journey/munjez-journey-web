import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({ content }: { content: string }) {
  let paragraphCount = 0;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => {
          paragraphCount += 1;
          return (
            <p className={paragraphCount === 1 ? "article-opening" : undefined}>
              {children}
            </p>
          );
        },
        img: ({ src, alt }) => (
          <span className="article-body-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" />
          </span>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
