import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const decksDir = join(process.cwd(), 'public/data/decks');
const outputFile = join(process.cwd(), 'public/data/decks.json');

// Parse command-line arguments
const excludeTestFiles = process.argv.includes('--exclude-test-files');

const decks = readdirSync(decksDir)
  .filter(f => f.endsWith('.json'))
  .filter(f => !excludeTestFiles || (!f.startsWith('my-test-') && !f.startsWith('my_test_')))
  .map((file) => {
    const identifier = file.replace(/\.json$/, '');
    const { desk, cards } = JSON.parse(readFileSync(join(decksDir, file), 'utf-8'));
    return { ...desk, identifier,cardCount: cards.length };
  });

// Check duplicated identifier
const seen = new Set<string>();
const duplicates = decks.map(d => d.identifier).filter(id => seen.size === seen.add(id).size);
const uniqueDuplicates = [...new Set<string>(duplicates)];
if (duplicates.length) {
  throw new Error(`Duplicate identifiers found: ${uniqueDuplicates.join(', ')}`);
}

writeFileSync(outputFile, JSON.stringify(decks, null, 2));
console.log(`Generated ${decks.length} decks → ${outputFile}`);
