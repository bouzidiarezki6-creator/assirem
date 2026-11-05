import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../src/lib/demoData.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Check wilayas
const wilayas = [...content.matchAll(/wilayaCode:\s*(\d+)/g)].map(m => parseInt(m[1]));
const uniqueWilayas = [...new Set(wilayas)];
console.log('Unique wilayas in demoData.ts:', uniqueWilayas);

// Check communes
const communes = [...content.matchAll(/commune:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
const uniqueCommunes = [...new Set(communes)];
console.log('Unique communes in demoData.ts:', uniqueCommunes);

// Verify allowed scope
const ALLOWED_WILAYAS = [6, 19];
const ALLOWED_COMMUNES = ['Béjaïa', 'Akbou', 'Sétif', 'El Eulma'];

const badWilayas = uniqueWilayas.filter(w => !ALLOWED_WILAYAS.includes(w));
const badCommunes = uniqueCommunes.filter(c => !ALLOWED_COMMUNES.includes(c));

console.log('Invalid wilayas:', badWilayas);
console.log('Invalid communes:', badCommunes);

// Extract DEMO_SOS_APPLICATIONS
const appMatches = [...content.matchAll(/id:\s*['"](demo-app-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g)];
console.log('\n--- DEMO SOS APPLICATIONS FOUND ---');
for (const match of appMatches) {
  console.log(`- ${match[1]}: status = ${match[2]}`);
}

// Extract DEMO_SOS_INTERVENTIONS
const intervMatches = [...content.matchAll(/id:\s*['"](demo-interv-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g)];
console.log('\n--- DEMO SOS INTERVENTIONS FOUND ---');
for (const match of intervMatches) {
  console.log(`- ${match[1]}: status = ${match[2]}`);
}

if (badWilayas.length === 0 && badCommunes.length === 0) {
  console.log('\nSUCCESS: All demo data strictly respects Béjaïa, Sétif, and El Eulma!');
} else {
  console.error('\nFAILURE: Found unauthorized wilayas or communes!');
  process.exit(1);
}
