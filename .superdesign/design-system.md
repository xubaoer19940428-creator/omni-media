# QuickClean design system

## Product

QuickClean is a focused, single-purpose utility for pasting a public video URL, checking its metadata, and downloading the available source file. The interface should feel trustworthy, fast, and technically competent rather than promotional or “AI magical.”

## Target visual direction

Use a refined light editorial-tool aesthetic inspired by precision instruments and contemporary publishing software.

- Canvas: warm paper white `#F4F1EA`
- Primary ink: `#161914`
- Muted ink: `#667067`
- Hairline: `#D7D8CF`
- Panel: `#FCFBF7`
- Signal green: `#C8F169`
- Signal blue: `#B9D9FF`
- Error: `#C24A36`
- Display type: `DM Sans`, strongly weighted and tightly tracked
- Body type: `DM Sans`
- Monospace labels: `IBM Plex Mono`
- Radius: 18px for main cards, 12px for controls, pill radius only for compact status tags
- Shadows: restrained, offset instrument-like shadows; avoid glowing glass effects
- Spacing: generous 8px rhythm, with 24–40px section gaps

## Layout

Desktop uses a slim top bar, a centered typographic masthead, a dominant command-bar URL input, and an instrument-panel result below. A compact compatibility rail and three-step workflow complete the page. Mobile collapses every panel into a single column with full-width actions.

## Components

- Primary action: ink background, white text, signal-green icon tile or accent
- Secondary action: transparent or panel background with a crisp 1px border
- Input: large, calm, high contrast, with a monospace URL affordance
- Platform chips: compact monochrome chips with one accent state
- Result media: 16:10 preview, editorial metadata hierarchy, compact numeric stats
- Status: concise language; no false claims about encryption, AI reconstruction, or cloud engines

## Motion

Use one orchestrated entrance with subtle stagger. Hover movement stays within 2–3px. Respect `prefers-reduced-motion`. Loading uses a purposeful linear sweep, not decorative spinning everywhere.

## Constraints

- Preserve all existing element IDs required by `static/js/app.js`.
- Preserve all parse, download, copy, cleanup, error, and loading flows.
- Keep all product interface copy in English.
- Use Bootstrap only as the existing structural dependency; custom CSS owns the visual system.
- Do not add a JavaScript framework or build step.
- Use only fonts, colors, spacing, and component styles defined here.
