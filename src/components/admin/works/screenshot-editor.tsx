"use client";

import { CompactMediaUpload } from "@/components/admin/media/compact-media-upload";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import type { WorkScreenshotInput } from "@/lib/works/types";

export function ScreenshotEditor({
  disabledHint,
  onChange,
  ownerId,
  screenshots,
}: {
  disabledHint?: string;
  onChange: (screenshots: WorkScreenshotInput[]) => void;
  ownerId?: string | null;
  screenshots: WorkScreenshotInput[];
}) {
  const normalize = (items: WorkScreenshotInput[]) =>
    items.map((item, index) => ({ ...item, sortOrder: index }));

  const update = (
    index: number,
    field: "imagePath" | "caption",
    value: string,
  ) => {
    onChange(
      screenshots.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= screenshots.length) return;
    const next = [...screenshots];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(normalize(next));
  };

  return (
    <section className="screenshot-editor">
      <div className="plan-editor-section-head">
        <div>
          <p className="eyebrow">SCREENSHOTS</p>
          <h2>详情截图</h2>
        </div>
        <button
          className="btn"
          onClick={() =>
            onChange([
              ...screenshots,
              { imagePath: "", caption: "", sortOrder: screenshots.length },
            ])
          }
          type="button"
        >
          添加截图
        </button>
      </div>
      <CompactMediaUpload
        disabledHint={disabledHint}
        label="Upload screenshots"
        multiple
        onUploaded={({ path }) =>
          onChange([
            ...screenshots,
            { imagePath: path, caption: "", sortOrder: screenshots.length },
          ])
        }
        ownerId={ownerId}
        purpose="works"
        value=""
        variant="screenshot"
      />
      {screenshots.length ? (
        <div className="screenshot-editor-list">
          {screenshots.map((screenshot, index) => (
            <article className="screenshot-editor-item" key={index}>
              <label>
                图片路径或 HTTPS URL
                <input
                  onChange={(event) =>
                    update(index, "imagePath", event.target.value)
                  }
                  placeholder="works/<id>/screenshots/... or https://..."
                  value={screenshot.imagePath}
                />
              </label>
              <label>
                图片说明
                <input
                  onChange={(event) =>
                    update(index, "caption", event.target.value)
                  }
                  value={screenshot.caption ?? ""}
                />
              </label>
              <div className="screenshot-editor-actions">
                <button
                  className="btn"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  type="button"
                >
                  上移
                </button>
                <button
                  className="btn"
                  disabled={index === screenshots.length - 1}
                  onClick={() => move(index, 1)}
                  type="button"
                >
                  下移
                </button>
                <button
                  className="btn danger"
                  onClick={() =>
                    onChange(
                      normalize(
                        screenshots.filter(
                          (_item, itemIndex) => itemIndex !== index,
                        ),
                      ),
                    )
                  }
                  type="button"
                >
                  删除
                </button>
              </div>
              {screenshot.imagePath ? (
                <div className="screenshot-editor-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={screenshot.caption ?? `Screenshot ${index + 1}`}
                    src={
                      resolveMediaDisplayUrl(
                        screenshot.imagePath,
                        publicMediaUrlForPath,
                      ) ?? screenshot.imagePath
                    }
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">暂未添加详情截图。</p>
      )}
    </section>
  );
}
