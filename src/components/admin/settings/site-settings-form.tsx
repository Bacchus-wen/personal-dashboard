import type {
  SiteConfigurationFieldErrors,
  SiteSettingsInput,
} from "@/lib/site-settings/types";
import { CompactMediaUpload } from "@/components/admin/media/compact-media-upload";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";

type Props = {
  settings: SiteSettingsInput;
  errors: SiteConfigurationFieldErrors;
  onChange: (settings: SiteSettingsInput) => void;
};

const fields: {
  key: keyof Omit<
    SiteSettingsInput,
    "moduleVisibility" | "navigationVisibility"
  >;
  label: string;
  placeholder?: string;
}[] = [
  { key: "siteTitle", label: "网站标题" },
  { key: "displayName", label: "用户名" },
  { key: "statusText", label: "状态短语" },
  { key: "avatarPath", label: "头像路径或 HTTPS 地址" },
  { key: "faviconPath", label: "Favicon 路径或 HTTPS 地址" },
  { key: "filingNumber", label: "备案号（可选）" },
  { key: "filingUrl", label: "备案链接（可选）" },
];

export function SiteSettingsForm({ settings, errors, onChange }: Props) {
  function update(
    key: keyof Omit<
      SiteSettingsInput,
      "moduleVisibility" | "navigationVisibility"
    >,
    value: string,
  ) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <section className="settings-panel glass">
      <div className="settings-panel-head">
        <div>
          <h2>网站设置</h2>
          <p className="muted">管理公开首页和网页 Metadata 使用的基础信息。</p>
        </div>
      </div>
      <div className="settings-form-grid">
        {fields.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              value={settings[field.key] ?? ""}
              onChange={(event) => update(field.key, event.target.value)}
              placeholder={field.placeholder}
            />
            {errors[field.key] ? (
              <small className="settings-field-error">
                {errors[field.key]?.[0]}
              </small>
            ) : null}
            {field.key === "avatarPath" || field.key === "faviconPath" ? (
              <CompactMediaUpload
                label={field.key === "avatarPath" ? "上传或替换头像" : "上传或替换 Favicon"}
                onClear={() => update(field.key, "")}
                onUploaded={({ path }) => update(field.key, path)}
                preview={
                  resolveMediaDisplayUrl(
                    settings[field.key],
                    publicMediaUrlForPath,
                  ) ?? undefined
                }
                purpose="site"
                value={settings[field.key]}
                variant={field.key === "avatarPath" ? "avatar" : "favicon"}
              />
            ) : null}
          </label>
        ))}
        <label className="settings-wide-field">
          <span>网站描述</span>
          <textarea
            rows={5}
            value={settings.siteDescription}
            onChange={(event) =>
              update("siteDescription", event.target.value)
            }
          />
          {errors.siteDescription ? (
            <small className="settings-field-error">
              {errors.siteDescription[0]}
            </small>
          ) : null}
        </label>
      </div>
    </section>
  );
}
