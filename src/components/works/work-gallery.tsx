import type { WorkScreenshot } from "@/lib/works/types";

export function WorkGallery({ screenshots }: { screenshots: WorkScreenshot[] }) {
  if (!screenshots.length) return null;
  return (
    <section className="work-gallery" aria-label="作品截图">
      {screenshots.map((screenshot) => (
        <figure className="work-gallery-item glass" key={screenshot.id ?? screenshot.sortOrder}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={screenshot.caption ?? "作品截图"} src={screenshot.imagePath} />
          {screenshot.caption ? <figcaption>{screenshot.caption}</figcaption> : null}
        </figure>
      ))}
    </section>
  );
}
