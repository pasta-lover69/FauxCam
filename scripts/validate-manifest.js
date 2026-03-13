#!/usr/bin/env node
/**
 * scripts/validate-manifest.js
 *
 * Validates that manifest.json satisfies the minimum requirements for a
 * Chrome Manifest V3 extension. Runs in CI before packaging.
 *
 * Exit code 0 = valid. Exit code 1 = invalid (errors printed to stderr).
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ── Required top-level fields ──────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  "manifest_version",
  "name",
  "version",
  "description",
  "permissions",
  "action",
  "content_scripts",
  "web_accessible_resources",
];

const REQUIRED_ICON_SIZES = ["16", "48"];

// ── Load manifest ──────────────────────────────────────────────────────────────

const manifestPath = path.resolve(__dirname, "../manifest.json");

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  process.stderr.write(`[validate-manifest] Failed to parse manifest.json: ${error.message}\n`);
  process.exit(1);
}

// ── Run checks ────────────────────────────────────────────────────────────────

const errors = [];

// Must be Manifest V3
if (manifest.manifest_version !== 3) {
  errors.push(`manifest_version must be 3, got: ${manifest.manifest_version}`);
}

// Required top-level fields must be present
for (const field of REQUIRED_FIELDS) {
  if (manifest[field] === undefined) {
    errors.push(`Missing required field: "${field}"`);
  }
}

// Version must follow semver-like x.y.z
if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
  errors.push(`version must follow x.y.z format, got: "${manifest.version}"`);
}

// Action icons must define minimum sizes
const actionIcons = manifest.action?.default_icon ?? {};
for (const size of REQUIRED_ICON_SIZES) {
  if (!actionIcons[size]) {
    errors.push(`action.default_icon is missing size "${size}"`);
  } else {
    // Verify the icon file actually exists
    const iconPath = path.resolve(__dirname, "..", actionIcons[size]);
    if (!fs.existsSync(iconPath)) {
      errors.push(`Icon file not found: ${actionIcons[size]}`);
    }
  }
}

// web_accessible_resources must reference inject.js
const resourceEntries = manifest.web_accessible_resources ?? [];
const injectIsAccessible = resourceEntries.some((entry) =>
  (entry.resources ?? []).includes("inject.js")
);
if (!injectIsAccessible) {
  errors.push('inject.js must be listed in web_accessible_resources');
}

// Content scripts must run at document_start
const contentScripts = manifest.content_scripts ?? [];
for (const script of contentScripts) {
  if (script.run_at !== "document_start") {
    errors.push(
      `Content script must use run_at: "document_start" (found: "${script.run_at}")`
    );
  }
}

// ── Report ─────────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  process.stderr.write("[validate-manifest] Manifest validation FAILED:\n");
  for (const error of errors) {
    process.stderr.write(`  ✗ ${error}\n`);
  }
  process.exit(1);
}

process.stdout.write("[validate-manifest] manifest.json is valid ✓\n");
process.exit(0);
