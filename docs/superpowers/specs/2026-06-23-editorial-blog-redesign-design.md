# Editorial Blog Redesign

## Product Direction

The public website becomes an editorial personal blog template rather than a dashboard of interchangeable glass cards. Content, identity, and reading flow take priority over decorative widgets. Existing routes, content management, authentication, and media behavior remain intact.

## Themes

The public website supports two published themes:

- `paper-editorial` is the default. It uses warm paper backgrounds, charcoal text, restrained brick-red accents, serif display typography, fine rules, and low-elevation surfaces.
- `night-radio` is optional. It uses deep navy backgrounds, warm amber highlights, cool blue secondary states, and stronger treatment for music and nighttime reading.

The selected theme is stored as `site_settings.theme_id`, validated as a closed union, published through `PublishedSiteConfiguration`, and applied at the public root with a stable data attribute. The protected admin interface remains a fixed neutral light workspace and does not inherit the public theme.

The existing theme placeholder becomes a real two-option theme selector with an honest preview, save state, and published-state behavior. No arbitrary color picker or custom theme builder is included.

## Homepage Structure

The homepage uses a designed editorial composition instead of arbitrary desktop grid coordinates:

1. Identity hero: display name, short introduction, current status, and primary navigation.
2. Primary editorial area: recent plans and works/recommendation receive the highest content weight.
3. Secondary journal area: album, music, and social links support the personal narrative without dominating the first screen.
4. Utility strip: clock and calendar are combined into a compact contextual element.
5. Footer information: filing and secondary metadata remain quiet.

Module visibility remains configurable. Module order remains configurable as a simple ordered list. The existing `home_layout` coordinate fields remain for storage compatibility, but the admin editor no longer exposes free x/y/width/height controls. Saves normalize the ordered modules into canonical coordinates, and the public renderer uses order and named editorial slots rather than arbitrary dimensions.

Empty modules collapse to compact editorial empty states. They must not reserve large first-screen areas.

## Public Content Pages

### Shared Shell

- Keep the icon navigation but add accessible hover/focus labels.
- Reduce title-region vertical padding so real content enters the first screen earlier.
- Replace repeated large glass cards with typographic sections, fine dividers, and selective surfaces.
- Preserve visible focus states, semantic landmarks, and 320px support.

### Works

- Lead with one featured work when available.
- Present remaining works as a compact editorial list or asymmetric grid with real cover media, status, technology, and summary hierarchy.
- Replace full-width low-information filters with a compact filter bar.
- Provide clear empty and missing-media states without repeating identical placeholder cards.

### About

- Use a two-column editorial profile on desktop and a natural reading flow on mobile.
- Support identity/portrait or signature space, concise introduction, interests, site purpose, and a restrained quotation.
- Avoid presenting all content inside one oversized Markdown-like card.

### Plans, Collections, and Featured Projects

- Use content-led rows with title, metadata, summary, and explicit interaction states.
- Avoid equal-weight card grids when the content hierarchy differs.

## Admin Workspace

The admin remains a fixed neutral light theme designed for repeated operational use:

- Retain the shared sidebar shell and active-route state.
- Reduce glass effects, oversized radii, and low-density cards.
- Prefer compact rows/tables for content lists while preserving existing actions.
- Standardize page headings, filters, form spacing, primary/secondary/danger buttons, notices, empty states, and dialogs.
- Move media test into a visually secondary development-tools group.
- On mobile, replace the sidebar with a compact top section selector and single-column forms.

No new analytics, permissions, or backend content behavior is introduced.

## Visual System

### Paper Editorial

- Background: warm ivory with subtle paper-like tonal variation, not decorative blobs.
- Text: charcoal with stronger body contrast than the current muted gray.
- Accent: brick red for primary actions and selected states; muted olive or ochre for secondary metadata.
- Typography: expressive serif display face paired with a readable sans-serif body and restrained mono labels.

### Night Radio

- Background: deep navy rather than pure black.
- Text: warm off-white with cool blue secondary text.
- Accent: amber for primary actions and playback; ice blue for secondary state.
- Media and music receive slightly stronger contrast, while reading surfaces remain calm.

### Shared Rules

- Use three deliberate radius levels for controls, content blocks, and major containers.
- Prefer borders and spacing over universal shadows.
- Use motion only for initial content reveal, expanding content, navigation state, and feedback.
- Keep all interactive states accessible in both themes.

## Responsive Behavior

- Desktop uses asymmetric editorial columns with intentional hierarchy.
- Tablet reduces columns without retaining empty grid cells.
- Mobile follows semantic content order in a single flow; no module may retain desktop fixed height or coordinates.
- Social links, filters, and navigation must not create horizontal page overflow.

## Verification

- Theme validation, persistence, and default fallback have focused tests.
- Module ordering and canonical layout normalization have focused tests.
- TypeScript and focused existing tests pass.
- Public homepage, works, about, plans, album, and shared navigation are inspected at desktop and mobile widths in both themes.
- Admin overview, one list page, one editor, settings, and music are inspected at desktop and mobile widths.
- No install, dependency download, full build, or unrelated refactor is required for the initial redesign slices.

## Delivery Slices

1. Theme data model, theme selector, and shared tokens.
2. Editorial homepage structure and order-only module settings.
3. Shared public shell, works, and about pages.
4. Plans, collections, projects, album, and supporting public components.
5. Admin density and component-system refinement.
6. Browser acceptance and final consistency review.

## Out of Scope

- Resume/PDF features.
- New article publishing backend.
- Arbitrary user-created themes.
- Drag-and-resize homepage layout editing.
- New authentication or authorization behavior.
- New dependencies unless separately approved.
