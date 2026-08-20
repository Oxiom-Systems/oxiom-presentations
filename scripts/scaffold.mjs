#!/usr/bin/env node

import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ownPath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(ownPath), "..");
const starterRoot = join(skillRoot, "assets", "starter");
const validatorPath = join(skillRoot, "scripts", "validate-deck.mjs");

function usage() {
  return [
    "Usage:",
    "  node scaffold.mjs --output <new-directory> --title <title> --client <name> [--subtitle <line>] [--slug <slug>]",
    "",
    "The output directory must not already exist.",
  ].join("\n");
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (!argument.startsWith("--")) throw new Error(`Unexpected argument: ${argument}`);
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    values[key] = value;
    index += 1;
  }
  return values;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function scriptGlobal(slug) {
  const stem = slug.replace(/[^a-z0-9]+/g, "_").toUpperCase();
  const safeStem = /^[A-Z_]/.test(stem) ? stem : `DECK_${stem}`;
  return `${safeStem || "OXIOM_PRESENTATION"}_SCRIPT`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".txt",
  ".yaml",
  ".yml",
]);

async function replaceTokens(root, replacements) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await replaceTokens(path, replacements);
      continue;
    }
    if (!textExtensions.has(extname(entry.name))) continue;
    const original = await readFile(path, "utf8");
    let updated = original;
    for (const [token, value] of Object.entries(replacements)) {
      updated = updated.replaceAll(`{{${token}}}`, value);
    }
    if (updated !== original) await writeFile(path, updated, "utf8");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const missing = ["output", "title", "client"].filter((key) => !args[key]?.trim());
  if (missing.length) throw new Error(`Missing required options: ${missing.join(", ")}\n\n${usage()}`);

  const output = resolve(args.output);
  if (await exists(output)) throw new Error(`Output already exists: ${output}`);

  const slug = args.slug ? slugify(args.slug) : slugify(args.title);
  if (!slug) throw new Error("Could not derive a safe slug. Pass --slug with letters or digits.");
  const title = args.title.trim();
  const client = args.client.trim();
  const subtitle = args.subtitle?.trim() || "A source-grounded story built for a clear audience decision.";
  const staging = join(dirname(output), `.${basename(output)}.tmp-${process.pid}`);

  if (await exists(staging)) throw new Error(`Staging path already exists: ${staging}`);
  await mkdir(dirname(output), { recursive: true });

  try {
    await cp(starterRoot, staging, { recursive: true, errorOnExist: true });
    await mkdir(join(staging, "scripts"), { recursive: true });
    await cp(validatorPath, join(staging, "scripts", "validate-deck.mjs"));
    await replaceTokens(staging, {
      CLIENT_NAME: client,
      CLIENT_NAME_HTML: escapeHtml(client),
      DECK_SUBTITLE_HTML: escapeHtml(subtitle),
      DECK_TITLE: title,
      DECK_TITLE_HTML: escapeHtml(title),
      SCRIPT_GLOBAL: scriptGlobal(slug),
      SLUG: slug,
    });
    await rename(staging, output);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }

  console.log(JSON.stringify({ output, slug, scriptGlobal: scriptGlobal(slug) }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
