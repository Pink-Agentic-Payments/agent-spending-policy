#!/usr/bin/env node
// Validates one or more agent-spending-policy JSON files against
// schema/agent-spending-policy.v0.1.schema.json using ajv.
//
// Usage: node validate.mjs <file.json> [file2.json ...]
// Exits 0 if every file is valid, 1 if any file fails.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "schema", "agent-spending-policy.v0.1.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node validate.mjs <file.json> [file2.json ...]");
  process.exit(1);
}

let anyFailed = false;

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  const isExpectedInvalid = path.basename(file).startsWith("invalid-");
  const valid = validate(data);

  if (valid) {
    if (isExpectedInvalid) {
      console.log(`FAIL ${file} — expected this example to be INVALID, but it passed validation`);
      anyFailed = true;
    } else {
      console.log(`PASS ${file}`);
    }
  } else {
    const messages = validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ");
    if (isExpectedInvalid) {
      console.log(`PASS ${file} — correctly rejected: ${messages}`);
    } else {
      console.log(`FAIL ${file} — ${messages}`);
      anyFailed = true;
    }
  }
}

process.exit(anyFailed ? 1 : 0);
