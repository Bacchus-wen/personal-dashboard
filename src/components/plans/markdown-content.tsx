import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { validateRelatedUrl } from "@/lib/plans/validation";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          a({ children, href }) {
            const safeHref = validateRelatedUrl(href ?? null);
            if (!safeHref) {
              return <span>{children}</span>;
            }

            const external = safeHref.startsWith("http");
            return (
              <a
                href={safeHref}
                rel={external ? "noreferrer noopener" : undefined}
                target={external ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
        }}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
