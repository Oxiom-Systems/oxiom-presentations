# Source-to-deck workflow

## Establish the communication contract

Write one internal sentence before building:

> By the end, **[audience]** should **[understand, believe, decide, or do]** because **[central takeaway supported by the sources]**.

Then identify:

- the audience and their prior knowledge;
- the presentation job: educate, align, persuade, recommend, review, or enable a decision;
- the requested duration and delivery setting;
- the decision, action, or discussion that should follow;
- the authoritative source set and any known conflicts, caveats, or missing facts;
- what must remain explicitly proposed, estimated, illustrative, confidential, or out of scope.

## Build the source ledger

Update `sources/source-ledger.txt` in the generated project. Record each source with a short identifier, date, owner or publisher, local path or URL, the claims or assets it supports, and any authority limitation.

Use the strongest available authority for each claim. If sources conflict, surface the conflict rather than blending them. A source artifact supplied only for content does not automatically become a visual template.

## Shape the story

Choose an arc that fits the communication job. Common arcs in this presentation family include:

- context → working evidence → remaining gap → gated path → decision;
- problem → consequences → operating model → proof → request;
- current state → target state → maturity gates → ownership → next step;
- question → analysis → answer → implications.

Create one line per slide: slide job, takeaway title, evidence, visual form, and transition to the next slide. Remove any slide whose absence does not weaken the argument or decision.

Opening and closing must correspond. If the opening promises a path from virtual proof to physical proof, the close must resolve who authorizes that path and what evidence closes the gate.

## Write for the room

- Visible copy serves the audience. Keep production notes, timing scaffolds, and source commentary in speaker notes or working files.
- State what the evidence means. A screenshot or metric without an interpretation is inventory, not a slide.
- Use concrete nouns and active verbs. Avoid inflated slogans, vague transformation language, and repeated rhetorical formulas.
- Keep proposals and estimates visibly qualified when that status matters.
- Write a conversational presenter script that adds reasoning and transitions instead of reading every visible word aloud.

## Agency-style coordination

When the user explicitly asks for an agency, delegation, or parallel build and the runtime supports agents, separate work by artifact boundary:

- a source analyst owns the ledger, claim authority, and gaps;
- a narrative lead owns the communication contract and slide sequence;
- a visual lead owns asset selection and the design-system fit;
- an implementation lead owns HTML, CSS, scripting, and tests;
- an independent reviewer owns source fidelity, full-size visual QA, and presenter/audience behavior.

The main agent remains responsible for the final story, held claims, consistency, and delivery. Avoid giving multiple agents write ownership of the same files.
