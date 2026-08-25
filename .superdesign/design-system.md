# OmniMedia web application design system

## Product and job

OmniMedia is a developer-first public-media parsing workbench. The primary web flow accepts a single public-media URL or copied share text, identifies one of 22 explicit platform domains, and renders normalized media metadata and download actions. The requested extension adds a second flow for a public creator/profile URL that returns a bounded, paginated list of public posts without changing the single-media contract.

## Existing home-page structure

- A floating navigation shell and bilingual light/dark controls.
- Product hero and supported-platform marquee.
- A centered workbench panel inside a maximum-width application container.
- The workbench resembles a precise technical console: macOS-style header, URL input, platform detection, actions, privacy note, errors, result content, and recent history.
- Other top-level tabs expose batch parsing, API playground, and platform matrix.

## Visual direction

Refined developer instrument with Vercel/Linear density and TikHub-like media utility. Preserve the existing visual language; the profile flow must feel like a native mode of the same workbench, not a separate marketing card or dashboard.

### Light theme

- Page: `#fafbfc`
- Surface: `#ffffff`
- Muted surface: `#f8fafc`
- Primary text: `#0f172a`
- Secondary text: `#475569`
- Muted text: `#94a3b8`
- Hairline: `#e2e8f0`
- Primary action: blue `#2563eb` to indigo `#4f46e5`

### Dark theme

- Page: `#07090e`
- Surface: `#0c1018`
- Muted surface: `#080c12`
- Primary text: `#f8fafc`
- Secondary text: `#94a3b8`
- Muted text: `#64748b`
- Hairline: `rgba(255,255,255,.08)`
- Primary action: cyan `#00f2fe` to indigo `#6366f1`

## Typography and components

- System UI for interface text and JetBrains Mono/monospace for URLs, status labels, and payload details.
- Strong hierarchy through weight, contrast, and spacing; avoid oversized marketing text inside the workbench.
- Main panels use 16px radii, fine borders, controlled shadows, and crisp muted surfaces.
- Use the existing gradient pill for the primary action; secondary actions are outlined or muted-surface controls.
- Platform identity always uses the existing official `PlatformIcon` component, never emoji or invented marks.

## Profile-flow interaction

- Inside the workbench, use a compact two-option segmented control: “Single media” and “Creator profile”.
- Switching mode updates label, placeholder, helper text, primary action, and result region without changing the page shell.
- Profile results begin with a compact creator summary and then a responsive media grid/list with cover, title, date/duration where available, and an action to open or parse an individual item.
- Show the bounded result count and a clear “Load more” affordance only when another cursor/page is available.
- Empty, unsupported, partial, loading, and error states must remain compact and accessible.

## Accessibility and motion

- All controls require visible focus styles, semantic labels, and keyboard access.
- Status updates use `aria-live` where appropriate.
- Preserve the existing restrained GSAP reveal behavior and respect reduced motion.
- All visible text has English and Simplified Chinese parity through the existing i18n dictionary.

## Hard constraints

- Preserve the explicit 22-platform hostname security boundary.
- Profile parsing is limited to public pages and a small server-enforced item count; no login scraping or private content.
- Keep `/api/parse` and its single-media response backward compatible.
- Use only the fonts, colors, spacing, and component styles defined here and in `frontend/src/app/globals.css`.
