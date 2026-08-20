---
name: oxiom-presentations
description: Create or adapt Oxiom-style HTML5 presentations from source material, with a synchronized audience deck and presenter console, evidence-aware narrative, print/PDF support, and optional voiceover or video. Use when work should follow the established NewSpace, CubeSpace, Dragonfly, or Vanilla Tech presentation mechanism; do not use for ordinary PPTX or Google Slides work unless the user explicitly asks for this HTML system.
---

# Oxiom Presentations

Build a self-contained, source-grounded HTML5 presentation that feels like the existing Oxiom presentation family while remaining specific to the audience and decision.

## Choose the mode

- For a new deck, scaffold the bundled starter with `scripts/scaffold.mjs` and then replace the sample story, copy, and media.
- For an existing Oxiom-family deck, preserve its working engine and adapt the narrative, theme extension, identifiers, sources, and assets in place.
- For PowerPoint or native Google Slides without this HTML mechanism, use the presentation workflow appropriate to that format instead.

## Build from evidence

Before authoring, identify the audience, presentation job, desired audience outcome, source authority, and delivery setting. Ask only when one of those cannot be inferred safely. Never convert a tentative target, estimate, proposal, or illustrative concept into an established fact.

Read [references/source-to-deck.md](references/source-to-deck.md) when synthesizing source material or coordinating an agency-style build. Keep a source ledger in the generated project and place a `[Sources]` block in every slide's hidden speaker notes.

Read [references/design-system.md](references/design-system.md) before choosing slide silhouettes, typography, palette, imagery, or motion. Reuse the design grammar; do not copy client claims or client-owned identity from an earlier deck.

## Scaffold a new presentation

Run:

```bash
node scripts/scaffold.mjs \
  --output /absolute/path/to/new-presentation \
  --title "Presentation title" \
  --client "Audience or organisation" \
  --subtitle "One-sentence audience promise"
```

The output path must not already exist. The command creates a dependency-free starter containing the audience deck, presenter console, source ledger, functional tests, and local validator.

## Author the deck

- Give every slide one narrative job and one audience-facing claim.
- Use takeaway titles rather than topic labels.
- Keep the title slide sparse, vary adjacent silhouettes, and alternate dark, paper, full-bleed, and structured evidence moments deliberately.
- Prefer a strong composition over card-heavy interface layouts.
- Use `data-reveal` only when the reveal order helps the spoken explanation.
- Keep the audience deck and `script-data.js` in the same order and with the same titles.
- Give each deck a unique `data-storage-key`, `data-channel`, and script global. Never reuse another client's live channel identifiers.
- Treat the Oxiom mark and system styling as the stable maker signature; treat client marks, imagery, copy, dates, metrics, and URLs as replaceable project content.
- Keep externally sourced claims and assets traceable. Do not invent proof, metrics, endorsements, approvals, sponsorship, or outcomes.

For technical extension points, read [references/extension-patterns.md](references/extension-patterns.md).

## Verify before delivery

Run the generated project's checks:

```bash
npm test
npm run validate
```

Then follow [references/qa-and-delivery.md](references/qa-and-delivery.md). Render or open every slide at the intended aspect ratio, inspect it individually at full size, test the presenter/audience connection, and fix clipping, accidental overlap, broken media, stale placeholders, and source mismatches before delivery.

Deliver the project directory as the editable source. Include the presenter console and, when requested, PDF, narrated video, or other derived outputs. Do not publish, upload, or deploy unless the user explicitly authorizes that action.
