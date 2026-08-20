# Engine and extension patterns

## Stable project shape

```text
presentation/
|-- package.json
|-- sources/source-ledger.txt
|-- public/deck/
|   |-- index.html
|   |-- presenter.html
|   |-- deck.js
|   |-- presenter.js
|   |-- script-data.js
|   |-- styles.css
|   |-- presenter-styles.css
|   |-- theme.css
|   `-- assets/
|-- scripts/validate-deck.mjs
`-- tests/deck.test.mjs
```

Keep the reusable engine in `deck.js`, `presenter.js`, `styles.css`, and `presenter-styles.css`. Put deck-specific layout and brand extensions in `theme.css`. This makes engine upgrades reviewable and stops client work from silently forking navigation behavior.

## Identity and synchronization

The audience and presenter documents must share these body data attributes:

- `data-storage-key`: unique local slide-position key;
- `data-channel`: unique BroadcastChannel and window-message namespace;
- `data-script-global`: JavaScript global containing the script array.

The audience document additionally provides `data-deck-title`, `data-presenter-script`, and `data-step-mode`. Use `slide` mode for whole-slide advances and `reveal` mode when progressive items should advance one at a time.

Never reuse another deck's storage key or channel. Derive them from the new project's slug.

## Add or remove a slide

1. Add or remove one `<section class="slide">` in `index.html`.
2. Keep slide ids sequential: `slide-1`, `slide-2`, and so on.
3. Add a concise `data-title`.
4. Add hidden `.speaker-notes` ending with a `[Sources]` block.
5. Add the matching object in `script-data.js` with the same slide number and title.
6. Run `npm test` and inspect both audience and presenter views.

## Media and interaction

- Video backgrounds use `[data-slide-video]`, are muted and inline, and require a poster fallback.
- Interactive canvases, maps, inputs, or controls must sit inside `[data-no-advance]` so audience-mode clicks do not advance unexpectedly.
- Use `data-narration-focus` only for an animation that should restart from the presenter console.
- `data-reveal` elements begin hidden and are exposed by the engine. Avoid applying it to essential content when printing unless the print rules force it visible.
- Keep all project assets local when offline delivery matters. Remote fonts already have offline fallbacks.

## Derived outputs

PDF, voiceover, and narrated video are derived artifacts. Keep them out of the source deck directory or place them under an ignored `outputs/` directory. Do not make generated outputs the only editable copy.

When adapting one of the existing voiceover/video builders, parameterize project root, script global, output directory, and artifact basename. Do not hardcode a previous client's slug, title, or scene descriptions.
