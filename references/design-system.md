# Oxiom presentation design system

Use this visual grammar as a stable family resemblance, not as a fixed sequence of slides.

## Character

The system is editorial, technical, and cinematic. It should feel confident enough for leadership and precise enough for engineers. The visual world combines dark control-room surfaces, bright paper interludes, cyan evidence lines, purposeful media, and large declarative typography.

Avoid generic corporate gradients, glossy sales language, dashboard-like card grids, decorative diagrams, tiny copy, and a different visual gimmick on every slide.

## Core tokens

The bundled starter preserves the established tokens:

- Ink: `#07111d`
- Ink soft: `#102235`
- Paper: `#f4f7f8`
- White: `#ffffff`
- Cyan: `#60d8ff`
- Blue: `#1688e8`
- Green: `#6fe0b5`
- Amber: `#ffc56e`
- Red: `#ff7a73`
- Muted: `#8291a3`

Kallisto is the preferred display face and Nunito the preferred body face through the existing Adobe Fonts kit. Helvetica and Arial remain the offline fallbacks. Do not replace the typography casually; its wide, engineered display forms are part of the family identity.

## Composition rules

- Use a stable 86vw content frame with equal left and right margins unless a full-bleed composition intentionally breaks it.
- Use display type at a scale that can be read across a room. Shorten copy before shrinking it.
- Keep titles to one or two deliberate lines. Prevent accidental wrapping in banners and labels.
- Let a slide contain one dominant visual or claim. Supporting material should explain it, not compete with it.
- Alternate silhouettes. Two consecutive slides should not look like duplicates unless repetition itself carries meaning.
- Use thin cyan rules, indices, and source/evidence labels as navigational signals, not decoration.
- Motion should reveal logic, maintain orientation, or add cinematic atmosphere. Respect `prefers-reduced-motion` and provide still-image fallbacks for video.

## Proven slide archetypes

Choose only the archetypes the story needs.

1. **Cinematic opening** — full-bleed image or restrained gradient, small contextual kicker, one large thesis, one short promise.
2. **Paper evidence** — light surface for facts, quotes, maturity gates, or comparison. Use strong ink typography and sparse cyan rules.
3. **Editorial split** — large claim on one side; proof, image, or concise structure on the other.
4. **System or process** — a single readable operating model, maturity path, or sequence. Keep labels short and make the direction obvious.
5. **Proof close-up** — screenshot, product image, or technical artifact at useful scale with a clear interpretation beside it.
6. **Decision close** — resolve the opening tension and make the decision, next gate, or requested action unmistakable.

The starter's `theme.css` demonstrates five neutral versions. Existing projects can also be mined for an appropriate established silhouette, but copy only the layout grammar and engine behavior—not client content or unverifiable claims.

## Branding boundaries

- Oxiom Systems is the maker signature. Keep its mark linked to `https://oxiomsystems.com` unless the user requests a white-label deck.
- Client identity belongs in the wordmark and selected brand moments, not as a watermark on every surface.
- Derive a restrained client accent only when it coexists cleanly with Oxiom cyan. Do not rebuild the entire system around every client logo.
- Never imply client approval, sponsorship, production readiness, or ownership merely because their brand appears in the deck.

## Media

Prefer project evidence, real product imagery, supplied photographs, or purpose-made visuals. Use decorative imagery only when it strengthens the current claim. Every sourced or generated asset belongs in the source ledger with its origin, license or generation note, intended use, and any caveat about illustration.
