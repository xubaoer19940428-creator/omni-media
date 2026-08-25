# OmniMedia browser extension design system

## Product and job

OmniMedia is a focused browser extension for pasting a public-media URL or a complete copied share message, detecting one of the explicitly supported 22 platforms, parsing normalized public metadata, and handing secure download work to the full OmniMedia web app. Pasted input is the primary workflow. Reading the active tab is an optional convenience action, never the only input method.

## Popup canvas and structure

- Fixed browser popup canvas: 400px wide, designed to fit comfortably around 600–640px tall without horizontal scrolling.
- Compact branded top bar: exact OmniMedia logo, wordmark, health status, language and theme controls.
- Dominant input workbench: a labeled multiline textarea for a URL or complete share text, platform detection feedback, optional “Use current tab” action, and one clear “Parse media” primary action.
- Progressive states below the workbench: loading, concise error, unsupported input, and a result card with cover, platform, title, author, duration, secure-download handoff, and web-app action.
- Compact privacy footer.

## Visual direction

Refined technical instrument with editorial clarity: compact, dense enough to feel capable, but calm and immediately understandable. It should resemble a polished Vercel/Linear-class utility, not a generic dashboard or a miniature landing page.

### Light theme

- Page: `#fafbfc`
- Surface: `#ffffff`
- Muted surface: `#f8fafc`
- Ink: `#0f172a`
- Secondary: `#475569`
- Muted: `#94a3b8`
- Hairline: `#e2e8f0`
- Primary: `#2563eb`
- Secondary accent: `#4f46e5`
- Signal cyan: `#00c8d7`
- Success: `#16a34a`

### Dark theme

- Page: `#07090e`
- Surface: `#0c1018`
- Muted surface: `#080c12`
- Ink: `#f8fafc`
- Secondary: `#94a3b8`
- Muted: `#64748b`
- Hairline: `rgba(255,255,255,.09)`
- Primary: `#00c8d7`
- Secondary accent: `#6366f1`
- Success: `#4ade80`

## Typography and components

- UI type: native system UI stack for extension reliability and zero remote fonts.
- Technical labels and detected URLs: native monospace stack.
- Strong type hierarchy using weight and tracking rather than oversized text.
- Main card radius: 16px; controls: 10–12px; compact pills only for statuses.
- Fine borders and controlled shadows; no decorative glassmorphism, purple hero gradient, or empty marketing art.
- Primary action: blue-to-indigo in light mode, cyan-to-indigo in dark mode, high-contrast white label.
- Secondary actions: outlined or muted-surface buttons with clear icons.
- Textarea: 96–112px tall, high contrast, visible focus ring, no hidden label.
- Result preview: approximately 112x74px, compact two-line title and single-line metadata.

## Interaction and accessibility

- Pasting or typing updates platform detection immediately using the first HTTP(S) URL found in the text.
- “Use current tab” populates the textarea and never auto-sends the URL.
- Parse stays disabled until a valid supported URL is detected.
- Loading and error states use `aria-live`; buttons remain keyboard accessible with clear focus rings.
- Respect `prefers-reduced-motion`; movement stays within 1–2px.
- English is the default and all visible copy has Simplified Chinese parity.

## Hard constraints

- Preserve the explicit 22-platform security boundary.
- Preserve Manifest V3 and the existing minimal `activeTab`, `storage`, and `https://useomnimedia.com/*` permissions.
- Do not add content scripts, background workers, clipboard permission, analytics, or remote executable code.
- Use the exact supplied OmniMedia logo; never invent or substitute the mark.
- Use only the fonts, colors, spacing, and component styles defined here.
