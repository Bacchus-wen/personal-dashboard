"use client";

import { SITE_THEMES, type ThemeId } from "@/lib/site-settings/theme";
import type { SiteConfigurationFieldErrors } from "@/lib/site-settings/types";

export function ThemeSelector({
  value,
  errors,
  onChange,
}: {
  value: ThemeId;
  errors: SiteConfigurationFieldErrors;
  onChange: (themeId: ThemeId) => void;
}) {
  return (
    <section className="settings-panel glass theme-selector">
      <div className="settings-panel-head">
        <div>
          <p className="eyebrow">PUBLIC THEME</p>
          <h2>主题外观</h2>
          <p className="muted">
            前台与后台都会应用所选主题。
          </p>
        </div>
      </div>
      <div className="theme-options" role="radiogroup" aria-label="公开网站主题">
        {SITE_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={
              value === theme.id ? "theme-option active" : "theme-option"
            }
            aria-pressed={value === theme.id}
            onClick={() => onChange(theme.id)}
          >
            <span className={`theme-swatch ${theme.id}`} aria-hidden="true" />
            <strong>{theme.label}</strong>
            <span>{theme.description}</span>
          </button>
        ))}
      </div>
      {errors.themeId?.length ? (
        <p className="field-error">{errors.themeId[0]}</p>
      ) : null}
    </section>
  );
}
