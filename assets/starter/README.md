# {{DECK_TITLE}}

This is an Oxiom HTML5 presentation for {{CLIENT_NAME}}.

## Open the presentation

- `public/deck/index.html` — control deck; add `?audience=1` for a clean audience surface
- `public/deck/presenter.html` — presenter console and read-aloud script

The files can be opened directly from disk in a modern browser. For two screens, open the presenter console and choose **Open audience screen**. Move the audience window to the second display and press **F** there for fullscreen.

## Controls

- `Space`, `Right Arrow`, or `Page Down`: advance
- `Left Arrow`, `Backspace`, or `Page Up`: go back
- `O`: overview
- `N`: notes
- `P`: presenter view
- `A`: audience view
- `F`: fullscreen

## Verify

```bash
npm test
npm run validate
```

Keep deck-specific styling in `public/deck/theme.css`. The navigation and presenter engine lives in the other shared CSS and JavaScript files.
