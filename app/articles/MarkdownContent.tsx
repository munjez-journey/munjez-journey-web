import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SPACER = "\u2063SPACER\u2063";

// أي سطر فيه +++ فقط يصبح فقرة مستقلة تحمل علامة داخلية، ثم تُرسم فراغاً.
// لا نلمس الأسطر داخل كتل الشيفرة ```.
function injectSpacers(content: string): string {
  let inFence = false;
  return content
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      return !inFence && line.trim() === "+++" ? `\n${SPACER}\n` : line;
    })
    .join("\n");
}

export default function MarkdownContent({
  content,
  highlightFirst = true,
}: {
  content: string;
  highlightFirst?: boolean;
}) {
  let paragraphCount = 0;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => {
          if (typeof children === "string" && children === SPACER) {
            return <div className="article-spacer" aria-hidden="true" />;
          }
          paragraphCount += 1;
          return (
            <p
              className={
                highlightFirst && paragraphCount === 1 ? "article-opening" : undefined
              }
            >
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
      {injectSpacers(content)}
    </ReactMarkdown>
  );
}
