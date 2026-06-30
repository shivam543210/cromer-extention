import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPIENTS_FILE = join(__dirname, 'recipients.json');

if (!existsSync(RECIPIENTS_FILE)) {
  console.log('[-] No recipients.json found.');
  process.exit(0);
}

const list = JSON.parse(readFileSync(RECIPIENTS_FILE, 'utf-8'));
console.log(`\n=== Dedup Report ===`);
console.log(`Total entries: ${list.length}`);

const seen = new Map();
const duplicates = [];

for (const item of list) {
  const key = item.email.toLowerCase();
  if (seen.has(key)) {
    duplicates.push({ original: seen.get(key), duplicate: item });
  } else {
    seen.set(key, item);
  }
}

const deduped = [...seen.values()];

if (duplicates.length === 0) {
  console.log(`No email duplicates found.`);
} else {
  console.log(`\nEmail Duplicates Removed:`);
  for (const d of duplicates) {
    console.log(`  Removed: ${d.duplicate.email}${d.duplicate.name ? ` (${d.duplicate.name})` : ''}`);
    const existing = deduped.find(r => r.email.toLowerCase() === d.original.email.toLowerCase());
    if (existing) {
      for (const c of d.duplicate.categories) {
        if (!existing.categories.includes(c)) existing.categories.push(c);
      }
    }
  }
}

const nameDups = [];
const namesSeen = new Map();
for (const item of deduped) {
  if (!item.name) continue;
  const key = item.name.toLowerCase().trim();
  if (namesSeen.has(key)) {
    nameDups.push({ original: namesSeen.get(key), duplicate: item });
  } else {
    namesSeen.set(key, item);
  }
}

if (nameDups.length > 0) {
  console.log(`\nSame Name - Different Emails (not removed):`);
  for (const d of nameDups) {
    console.log(`  "${d.original.name}": ${d.original.email}, ${d.duplicate.email}`);
  }
}

writeFileSync(RECIPIENTS_FILE, JSON.stringify(deduped, null, 2));
console.log(`\n✓ Done! Saved ${deduped.length} unique entries (removed ${duplicates.length} duplicates).\n`);
