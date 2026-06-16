import { navigation } from "@/data/site-content";
import {
  PUBLIC_NAVIGATION_IDS,
  type NavigationVisibility,
  type PublicNavigationId,
} from "@/lib/navigation/visibility";
import type { SiteConfigurationFieldErrors } from "@/lib/site-settings/types";

type Props = {
  visibility: NavigationVisibility;
  errors: SiteConfigurationFieldErrors;
  onChange: (visibility: NavigationVisibility) => void;
};

export function NavigationVisibilityEditor({
  visibility,
  errors,
  onChange,
}: Props) {
  function update(id: PublicNavigationId, enabled: boolean) {
    onChange({ ...visibility, [id]: enabled });
  }

  return (
    <section className="settings-panel glass">
      <div className="settings-panel-head">
        <div>
          <h2>导航显示</h2>
          <p className="muted">
            控制首页侧边栏和分页顶部导航显示哪些公开入口；头像入口始终进入后台。
          </p>
        </div>
      </div>
      {errors.navigationVisibility ? (
        <p className="settings-field-error">{errors.navigationVisibility[0]}</p>
      ) : null}
      <div className="layout-module-toggles">
        {PUBLIC_NAVIGATION_IDS.map((id) => {
          const item = navigation.find((entry) => entry.id === id);
          return (
            <label className="settings-check" key={id}>
              <input
                checked={visibility[id]}
                type="checkbox"
                onChange={(event) => update(id, event.target.checked)}
              />
              <span>{item?.label ?? id}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
