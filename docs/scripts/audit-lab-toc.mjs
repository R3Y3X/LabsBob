#!/usr/bin/env node
/**
 * Audits lab HTML fragments: every h2 used by the TOC must exist,
 * have a unique id (or a unique generated slug), and not collide.
 *
 * Run from repo root: node docs/scripts/audit-lab-toc.mjs
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteData } from '../js/data.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function slugify(text) {
  return text
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'seccion';
}

function extractH2(html) {
  const headings = [];
  const re = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  let match;
  while ((match = re.exec(html))) {
    const attrs = match[1] || '';
    const inner = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    headings.push({ id: idMatch ? idMatch[1] : '', label: inner });
  }
  return headings.filter((h) => h.label.length > 0);
}

const errors = [];
let pages = 0;
let headingsChecked = 0;

for (const section of siteData.sections) {
  for (const lab of section.labs) {
    for (const step of lab.steps) {
      pages += 1;
      const filePath = resolve(root, step.file.replace(/^\.\//, ''));
      let html;
      try {
        html = await readFile(filePath, 'utf8');
      } catch (err) {
        errors.push(`${lab.slug}/${step.slug}: missing file ${step.file}`);
        continue;
      }

      const headings = extractH2(html);
      headingsChecked += headings.length;
      const used = new Set();
      const prefix = `${lab.slug}-${step.slug}`;

      for (const heading of headings) {
        let id = heading.id;
        if (!id) id = `${prefix}-${slugify(heading.label)}`;
        if (used.has(id)) {
          errors.push(`${lab.slug}/${step.slug}: duplicate heading id "${id}" (${heading.label})`);
        }
        used.add(id);
      }
    }
  }
}

if (errors.length) {
  console.error(`TOC audit failed (${errors.length} issues, ${pages} pages, ${headingsChecked} h2):`);
  errors.forEach((line) => console.error(`  - ${line}`));
  process.exit(1);
}

console.log(`TOC audit ok: ${pages} pages, ${headingsChecked} h2 headings, unique ids.`);
