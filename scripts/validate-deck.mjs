#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import vm from "node:vm";

const root = resolve(process.argv[2] || ".");
const requiredFiles = [
  "package.json",
  "sources/source-ledger.txt",
  "public/deck/index.html",
  "public/deck/presenter.html",
  "public/deck/deck.js",
  "public/deck/presenter.js",
  "public/deck/script-data.js",
  "public/deck/styles.css",
  "public/deck/presenter-styles.css",
  "public/deck/theme.css",
];

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

async function read(relativePath) {
  return readFile(join(root, relativePath), "utf8");
}

function attribute(html, name) {
  return html.match(new RegExp(`${name}="([^"]+)"`))?.[1] || "";
}

for (const relativePath of requiredFiles) {
  try {
    const info = await stat(join(root, relativePath));
    check(info.isFile(), `${relativePath} is not a file`);
  } catch {
    errors.push(`Missing required file: ${relativePath}`);
  }
}

if (!errors.length) {
  const [audience, presenter, scriptSource, sourceLedger] = await Promise.all([
    read("public/deck/index.html"),
    read("public/deck/presenter.html"),
    read("public/deck/script-data.js"),
    read("sources/source-ledger.txt"),
  ]);
  const inspectedText = `${audience}\n${presenter}\n${scriptSource}\n${sourceLedger}`;
  check(!inspectedText.includes("{{"), "Unresolved scaffold token found");

  const slideTags = [...audience.matchAll(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>/g)].map((match) => match[0]);
  check(slideTags.length > 0, "No audience slides found");
  const ids = slideTags.map((tag) => attribute(tag, "id"));
  const titles = slideTags.map((tag) => attribute(tag, "data-title"));
  ids.forEach((id, index) => check(id === `slide-${index + 1}`, `Expected slide-${index + 1}, found ${id || "missing id"}`));
  titles.forEach((title, index) => check(Boolean(title.trim()), `Slide ${index + 1} is missing data-title`));

  const noteCount = (audience.match(/class="speaker-notes"/g) || []).length;
  const sourceBlockCount = (audience.match(/\[Sources\]/g) || []).length;
  check(noteCount === slideTags.length, `Expected ${slideTags.length} speaker notes, found ${noteCount}`);
  check(sourceBlockCount === slideTags.length, `Expected ${slideTags.length} [Sources] blocks, found ${sourceBlockCount}`);

  const imageTags = audience.match(/<img\b[^>]*>/g) || [];
  imageTags.forEach((tag, index) => check(/\balt="[^"]*"/.test(tag), `Image ${index + 1} is missing alt text`));

  const audienceIdentity = {
    channel: attribute(audience, "data-channel"),
    script: attribute(audience, "data-script-global"),
    storage: attribute(audience, "data-storage-key"),
  };
  const presenterIdentity = {
    channel: attribute(presenter, "data-channel"),
    script: attribute(presenter, "data-script-global"),
    storage: attribute(presenter, "data-storage-key"),
  };
  for (const key of Object.keys(audienceIdentity)) {
    check(Boolean(audienceIdentity[key]), `Audience ${key} identity is missing`);
    check(audienceIdentity[key] === presenterIdentity[key], `Audience and presenter ${key} identities differ`);
  }

  const context = { window: {} };
  try {
    vm.runInNewContext(scriptSource, context, { filename: "script-data.js" });
  } catch (error) {
    errors.push(`script-data.js could not be evaluated: ${error.message}`);
  }
  const script = context.window[audienceIdentity.script];
  check(Array.isArray(script), `window.${audienceIdentity.script || "<missing>"} is not an array`);
  if (Array.isArray(script)) {
    check(script.length === slideTags.length, `Expected ${slideTags.length} script entries, found ${script.length}`);
    script.forEach((entry, index) => {
      check(entry.slide === index + 1, `Script entry ${index + 1} has slide ${entry.slide}`);
      check(entry.title === titles[index], `Slide ${index + 1} title differs between audience and script`);
      check(typeof entry.duration === "string" && entry.duration.trim(), `Script entry ${index + 1} needs a duration`);
      check(Array.isArray(entry.paragraphs) && entry.paragraphs.length > 0, `Script entry ${index + 1} needs narration`);
    });
  }
}

if (errors.length) {
  console.error(`Deck validation failed (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Deck validation passed: ${root}`);
}
