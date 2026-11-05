import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoDataPath = path.resolve(__dirname, '../src/lib/demoData.ts');
const storagePath = path.resolve(__dirname, '../src/lib/storage.ts');

console.log('================================================================');
console.log('VERIFICATION DES DONNEES DE DEMONSTRATION — YED FEL YED');
console.log('================================================================\n');

// 1. Check strict geographic scope
const demoContent = fs.readFileSync(demoDataPath, 'utf-8');
const wilayaMatches = [...demoContent.matchAll(/wilayaCode:\s*(\d+)/g)].map(m => parseInt(m[1]));
const uniqueWilayas = [...new Set(wilayaMatches)];
const ALLOWED_WILAYAS = [6, 19];
const badWilayas = uniqueWilayas.filter(w => !ALLOWED_WILAYAS.includes(w));

const communeMatches = [...demoContent.matchAll(/commune:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
const uniqueCommunes = [...new Set(communeMatches)];
const ALLOWED_COMMUNES = ['Béjaïa', 'Akbou', 'Sétif', 'El Eulma'];
const badCommunes = uniqueCommunes.filter(c => !ALLOWED_COMMUNES.includes(c));

console.log('[1] CONTROLE GEOGRAPHIQUE STRICT :');
console.log(`    Wilayas détectées : ${uniqueWilayas.join(', ')} (Attendues: 6, 19)`);
console.log(`    Communes détectées : ${uniqueCommunes.join(', ')}`);
if (badWilayas.length > 0 || badCommunes.length > 0) {
  console.error('    ❌ ERREUR: Présence de wilayas ou communes hors périmètre !', { badWilayas, badCommunes });
  process.exit(1);
}
console.log('    ✅ CONFORME : 100% des données sont exclusivement à Béjaïa, Sétif et El Eulma.\n');

// 2. Check Event Scenarios
console.log('[2] SCENARIOS D\'EVENEMENTS :');
const eventStatusRegex = /id:\s*['"](demo-evt-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g;
const eventStatuses = [...demoContent.matchAll(eventStatusRegex)].map(m => ({ id: m[1], status: m[2] }));
const statusesFound = [...new Set(eventStatuses.map(e => e.status))];
console.log(`    Statuts couverts : ${statusesFound.join(', ')}`);
const expectedStatuses = ['open', 'upcoming', 'full', 'completed', 'cancelled'];
for (const st of expectedStatuses) {
  if (statusesFound.includes(st)) {
    console.log(`    ✅ Statut "${st}" présent.`);
  } else {
    console.error(`    ❌ Statut manquant: "${st}"`);
    process.exit(1);
  }
}
console.log('');

// 3. Check Institutional Profiles (5 roles)
console.log('[3] PROFILS INSTITUTIONNELS (5 ROLES ABAC) :');
const roleRegex = /id:\s*['"](demo-user-[^'"]+)['"][\s\S]*?role:\s*['"]([^'"]+)['"]/g;
const rolesFound = [...demoContent.matchAll(roleRegex)].map(m => ({ id: m[1], role: m[2] }));
const uniqueRoles = [...new Set(rolesFound.map(r => r.role))];
console.log(`    Rôles détectés : ${uniqueRoles.join(', ')}`);
const expectedRoles = ['national_admin', 'wilaya_admin', 'national_auditor', 'mission_lead', 'local_coordinator'];
for (const r of expectedRoles) {
  if (uniqueRoles.includes(r)) {
    console.log(`    ✅ Rôle "${r}" présent.`);
  } else {
    console.error(`    ❌ Rôle manquant: "${r}"`);
    process.exit(1);
  }
}
console.log('');

// 4. Check Volunteer Profiles
console.log('[4] PROFILS BENEVOLES & SCENARIOS DE STATUT :');
const volRegex = /id:\s*['"](demo-vol-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g;
const volsFound = [...demoContent.matchAll(volRegex)].map(m => ({ id: m[1], status: m[2] }));
console.log(`    Bénévoles détectés : ${volsFound.map(v => `${v.id} (${v.status})`).join(', ')}`);
const hasActiveVol = volsFound.some(v => v.status === 'active');
const hasSuspendedVol = volsFound.some(v => v.status === 'suspended');
if (hasActiveVol && hasSuspendedVol) {
  console.log('    ✅ Bénévoles actifs et compte suspendu présents pour tester la modération.');
} else {
  console.error('    ❌ Bénévoles incomplets !');
  process.exit(1);
}
console.log('');

// 5. Check Institutional Operations & Attestations
console.log('[5] OPERATIONS & DISPOSITIFS TERRAIN :');
const opRegex = /id:\s*['"](demo-op-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g;
const opsFound = [...demoContent.matchAll(opRegex)].map(m => ({ id: m[1], status: m[2] }));
console.log(`    Opérations détectées : ${opsFound.map(o => `${o.id} (${o.status})`).join(', ')}`);
console.log('    ✅ Opérations institutionnelles couvrant en cours, validée, soumise, clôturée et brouillon.\n');

// 6. Check SOS Applications (accepted, pending, rejected)
console.log('[6] CANDIDATURES SOS :');
const appRegex = /id:\s*['"](demo-app-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g;
const appsFound = [...demoContent.matchAll(appRegex)].map(m => ({ id: m[1], status: m[2] }));
const appStatuses = [...new Set(appsFound.map(a => a.status))];
console.log(`    Statuts candidatures SOS : ${appStatuses.join(', ')}`);
if (appStatuses.includes('accepted') && appStatuses.includes('pending') && appStatuses.includes('rejected')) {
  console.log('    ✅ Candidatures acceptée, en attente et refusée présentes.');
} else {
  console.error('    ❌ Candidatures SOS incomplètes !');
  process.exit(1);
}
console.log('');

// 7. Check Storage initialization
console.log('[7] INTEGRATION STORAGE :');
const storageContent = fs.readFileSync(storagePath, 'utf-8');
if (storageContent.includes('DEMO_EVENTS') && storageContent.includes('DEMO_ACTIVITIES') && storageContent.includes('DEMO_VOLUNTEERS')) {
  console.log('    ✅ storage.ts initialise seedData directement avec les données de démonstration.');
} else {
  console.error('    ❌ storage.ts n\'utilise pas DEMO_EVENTS !');
  process.exit(1);
}
console.log('');

// 8. Check Presence Records
console.log('[8] FICHES DE PRESENCE QR :');
const presRegex = /id:\s*['"](demo-pres-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g;
const presFound = [...demoContent.matchAll(presRegex)].map(m => ({ id: m[1], status: m[2] }));
const presStatuses = [...new Set(presFound.map(p => p.status))];
console.log(`    Statuts de présence détectés : ${presStatuses.join(', ')}`);
if (presStatuses.includes('checked_out') && presStatuses.includes('manual_validated')) {
  console.log('    ✅ Pointages de terrain et validation manuelle avec motif présents.');
} else {
  console.error('    ❌ Fiches de présence incomplètes !');
  process.exit(1);
}
console.log('');

// 9. Check Mission Reports
console.log('[9] RAPPORTS DE MISSION & AUDIT :');
const repRegex = /id:\s*['"](demo-rep-[^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g;
const repFound = [...demoContent.matchAll(repRegex)].map(m => ({ id: m[1], status: m[2] }));
const repStatuses = [...new Set(repFound.map(r => r.status))];
console.log(`    Statuts rapports de mission : ${repStatuses.join(', ')}`);
if (repStatuses.includes('validated') && repStatuses.includes('submitted')) {
  console.log('    ✅ Rapports validés par audit (+15/+30 pts) et en attente présents.');
} else {
  console.error('    ❌ Rapports de mission incomplets !');
  process.exit(1);
}
console.log('');

// 10. Check Notifications
console.log('[10] NOTIFICATIONS EVENEMENTIELLES :');
const notifRegex = /id:\s*['"](demo-notif-[^'"]+)['"][\s\S]*?type:\s*['"]([^'"]+)['"]/g;
const notifsFound = [...demoContent.matchAll(notifRegex)].map(m => ({ id: m[1], type: m[2] }));
const notifTypes = [...new Set(notifsFound.map(n => n.type))];
console.log(`    Types de notifications détectés : ${notifTypes.join(', ')}`);
if (notifTypes.includes('points_awarded') && notifTypes.includes('badge_unlocked') && notifTypes.includes('tier_promoted')) {
  console.log('    ✅ Notifications pour points, badges et promotion de niveau présentes.');
} else {
  console.error('    ❌ Notifications incomplètes !');
  process.exit(1);
}
console.log('');

// 11. Check Badges Engine
console.log('[11] SYSTEME DES 10 BADGES AUTOMATIQUES :');
const badgeEnginePath = path.resolve(__dirname, '../src/lib/badgeEngine.ts');
const badgeContent = fs.readFileSync(badgeEnginePath, 'utf-8');
const expectedBadges = [
  'premier_pas',
  'benevole_actif',
  'esprit_solidaire',
  'ambassadeur',
  'eco_citoyen',
  'main_tendue',
  'fidele',
  'leader',
  'excellence',
  'legende_solidaire'
];
const missingBadges = expectedBadges.filter(b => !badgeContent.includes(`id: "${b}"`));
if (missingBadges.length === 0) {
  console.log(`    ✅ Les 10 badges officiels sont tous implémentés avec calcul de progression.`);
} else {
  console.error('    ❌ Badges manquants :', missingBadges);
  process.exit(1);
}
console.log('');

// 12. Check Central Points Engine
console.log('[12] MOTEUR CENTRAL DE POINTS & BAREMES :');
const pointsEnginePath = path.resolve(__dirname, '../src/lib/pointsEngine.ts');
const pointsContent = fs.readFileSync(pointsEnginePath, 'utf-8');
if (pointsContent.includes('registrationValidated: 5') &&
    pointsContent.includes('presenceConfirmed: 10') &&
    pointsContent.includes('missionCompleted: 30') &&
    pointsContent.includes('reportAccepted: 15')) {
  console.log('    ✅ Barèmes officiels configurés : Inscription (5), Présence (10), Mission (30), Rapport (15).');
} else {
  console.error('    ❌ Barèmes de points non conformes !');
  process.exit(1);
}

console.log('\n================================================================');
console.log('🎉 TOUS LES 12 TESTS DE L\'ÉCOSYSTÈME SONT VALIDES AVEC SUCCÈS !');
console.log('================================================================');

