// prisma/seed.js
// Bulk-loads prohibited words into the database.
//
// Reads words from prisma/prohibited_words.txt (one word per line;
// blank lines and lines starting with '#' are ignored). Words are
// normalized to lowercase and de-duplicated. Safe to run repeatedly —
// existing words are skipped, not duplicated.
//
// Run with: npm run prisma:seed

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_FILE = join(__dirname, 'prohibited_words.txt');

async function loadWords() {
  const raw = await readFile(WORDS_FILE, 'utf8');

  const words = raw
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  // De-duplicate within the file itself.
  return [...new Set(words)];
}

async function main() {
  const words = await loadWords();

  if (words.length === 0) {
    console.log('No words found in prohibited_words.txt — nothing to seed.');
    return;
  }

  const result = await prisma.prohibitedWord.createMany({
    data: words.map((word) => ({ word })),
    skipDuplicates: true,
  });

  console.log(
    `Seed complete: ${result.count} new word(s) added ` +
      `(${words.length - result.count} already existed) ` +
      `out of ${words.length} in the file.`
  );
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
