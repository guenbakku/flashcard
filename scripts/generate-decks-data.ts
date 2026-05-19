import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const decksDir = join(process.cwd(), 'public/data/decks');
const outputFile = join(process.cwd(), 'public/data/decks.json');

const decks = readdirSync(decksDir)
  .filter(f => f.endsWith('.json'))
  .map((file) => {
    const { desk, cards } = JSON.parse(readFileSync(join(decksDir, file), 'utf-8'));
    return { ...desk, cardCount: cards.length };
  });

writeFileSync(outputFile, JSON.stringify(decks, null, 2));
console.log(`Generated ${decks.length} decks → ${outputFile}`);
