# QA and delivery

## Structural checks

Run both generated commands:

```bash
npm test
npm run validate
```

They check the required files, sequential slide ids, matching audience/script counts and titles, synchronization identifiers, source blocks, image alt attributes, and unresolved scaffold tokens.

## Full-size visual review

Open or render every slide at 16:9, ideally 1920×1080. Inspect slides one at a time; a montage is useful only for pacing and family consistency.

Fix:

- clipped or unexpectedly wrapped titles;
- copy that is too small for a room;
- accidental overlap and imbalanced margins;
- low-resolution or badly cropped media;
- inconsistent client/Oxiom identity;
- repeated silhouettes without narrative reason;
- stale template copy, dates, URLs, labels, or sample sources;
- diagrams whose direction or labels are unclear.

Test a narrow viewport only to confirm the fallback is usable. The primary design target remains a 16:9 presentation surface.

## Functional review

Verify:

- keyboard navigation, overview, notes, and fullscreen;
- progressive reveal behavior or whole-slide mode, as intended;
- presenter console slide selection and read-aloud script;
- audience-window launch and bidirectional synchronization;
- restart behavior for video or narration-focused motion;
- reduced-motion behavior;
- direct `file://` use when offline delivery is required;
- landscape print/PDF with backgrounds enabled.

## Evidence review

- Trace every non-trivial external claim and asset to the source ledger.
- Confirm every slide has a `[Sources]` block in speaker notes.
- Check that visible qualifications match source authority: proposed, estimated, illustrative, targeted, approved, accepted, or production-ready.
- Remove unsupported metrics, endorsements, and outcome language.
- Confirm client logos and screenshots are authorized for the intended audience.

## Delivery bundle

Always retain the editable source project. Depending on the request, include:

- `public/deck/index.html` for the control/audience deck;
- `public/deck/presenter.html` for the presenter console;
- local assets and the source ledger;
- a PDF backup;
- a narrated video and its script/manifest;
- a short run note for two-screen presentation.

Publishing or deploying is a separate external action and requires explicit user authorization.
