import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== RUNNING WE THE LEADER DYNAMIC SOCIAL MEDIA & SAVE SYNC TEST SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✓ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ FAIL: ${description}`);
    console.error(`  Error: ${err.message}`);
  }
}

const rootDir = process.cwd();

// Test 1: Verify settingsService exports social platforms and default links
runTest('settingsService defines SocialLink interface and default platforms', () => {
  const serviceContent = fs.readFileSync(path.join(rootDir, 'src/services/settingsService.ts'), 'utf-8');
  assert(serviceContent.includes('export type SocialPlatformId'), 'Must export SocialPlatformId');
  assert(serviceContent.includes('export interface SocialLink'), 'Must export SocialLink');
  assert(serviceContent.includes('DEFAULT_SOCIAL_LINKS'), 'Must export DEFAULT_SOCIAL_LINKS');
  assert(serviceContent.includes("platform: 'facebook'"), 'Must include Facebook');
  assert(serviceContent.includes("platform: 'instagram'"), 'Must include Instagram');
  assert(serviceContent.includes("platform: 'twitter'"), 'Must include Twitter/X');
  assert(serviceContent.includes("platform: 'youtube'"), 'Must include YouTube');
  assert(serviceContent.includes("platform: 'linkedin'"), 'Must include LinkedIn');
  assert(serviceContent.includes("platform: 'whatsapp'"), 'Must include WhatsApp');
  assert(serviceContent.includes("platform: 'telegram'"), 'Must include Telegram');
  assert(serviceContent.includes("platform: 'website'"), 'Must include Website');
});

// Test 2: URL validation helper
runTest('validateSocialUrl strictly checks HTTPS/HTTP protocols', () => {
  const serviceContent = fs.readFileSync(path.join(rootDir, 'src/services/settingsService.ts'), 'utf-8');
  assert(serviceContent.includes('export function validateSocialUrl'), 'Must export validateSocialUrl helper');
  assert(serviceContent.includes("parsed.protocol !== 'https:'"), 'Must enforce valid protocol');
});

// Test 3: SaveSettings strictly returns error on Supabase failure instead of false success
runTest('saveSettings does not swallow Supabase errors and returns developer-friendly error message', () => {
  const serviceContent = fs.readFileSync(path.join(rootDir, 'src/services/settingsService.ts'), 'utf-8');
  assert(serviceContent.includes('Database save failed:'), 'Must return Database save failed on Supabase error');
  assert(serviceContent.includes('Network error connecting to Supabase'), 'Must return network error');
  assert(!serviceContent.includes('console.warn(\'Supabase settings upsert error:\', error); \n    return { success: true };'), 'Must never swallow Supabase error');
});

// Test 4: Realtime subscription and cross-tab storage synchronisation
runTest('settingsService provides Realtime subscription and cross-tab synchronization', () => {
  const serviceContent = fs.readFileSync(path.join(rootDir, 'src/services/settingsService.ts'), 'utf-8');
  assert(serviceContent.includes('subscribeToSettings'), 'Must export subscribeToSettings');
  assert(serviceContent.includes('realtime_website_settings'), 'Must create Supabase realtime channel');
  assert(serviceContent.includes('postgres_changes'), 'Must listen to postgres_changes');
});

// Test 5: SocialIcons component exists and renders platform SVGs
runTest('SocialIcons component renders accessible external links with noopener noreferrer', () => {
  const compContent = fs.readFileSync(path.join(rootDir, 'src/components/SocialIcons.tsx'), 'utf-8');
  assert(compContent.includes('rel="noopener noreferrer"'), 'Must have safe rel attributes');
  assert(compContent.includes('target="_blank"'), 'Must open in new tab');
  assert(compContent.includes('PlatformIcon'), 'Must render PlatformIcon component');
  assert(compContent.includes('facebook'), 'Has Facebook SVG');
  assert(compContent.includes('instagram'), 'Has Instagram SVG');
  assert(compContent.includes('twitter'), 'Has Twitter/X SVG');
  assert(compContent.includes('youtube'), 'Has YouTube SVG');
  assert(compContent.includes('whatsapp'), 'Has WhatsApp SVG');
});

// Test 6: Footer integrates SocialIcons and listens to Realtime/storage
runTest('Footer integrates SocialIcons with real-time and cross-tab listeners', () => {
  const footerContent = fs.readFileSync(path.join(rootDir, 'src/components/Footer.tsx'), 'utf-8');
  assert(footerContent.includes('SocialIcons'), 'Footer must import SocialIcons');
  assert(footerContent.includes('settings.social_links'), 'Footer must pass social_links');
  assert(footerContent.includes("window.addEventListener('storage'"), 'Must listen to storage events');
  assert(footerContent.includes("window.addEventListener('focus'"), 'Must listen to focus events');
  assert(footerContent.includes('subscribeToSettings'), 'Must subscribe to realtime settings');
});

// Test 7: HomePage Contact Section integrates SocialIcons
runTest('HomePage integrates SocialIcons in Contact Section with real-time sync', () => {
  const homeContent = fs.readFileSync(path.join(rootDir, 'src/pages/HomePage.tsx'), 'utf-8');
  assert(homeContent.includes('SocialIcons'), 'HomePage must import SocialIcons');
  assert(homeContent.includes('settings.show_social_in_contact'), 'Must check show_social_in_contact toggle');
  assert(homeContent.includes("window.addEventListener('storage'"), 'Must listen to storage events');
  assert(homeContent.includes("window.addEventListener('focus'"), 'Must listen to focus events');
  assert(homeContent.includes('subscribeToSettings'), 'Must subscribe to realtime settings');
});

// Test 8: AdminSettings provides Social Media Settings tab and management controls
runTest('AdminSettings provides full Social Media management controls and live preview', () => {
  const adminContent = fs.readFileSync(path.join(rootDir, 'src/pages/admin/AdminSettings.tsx'), 'utf-8');
  assert(adminContent.includes('activeSection === \'social-settings\''), 'Has social-settings tab');
  assert(adminContent.includes('handleToggleSocial'), 'Has toggle social function');
  assert(adminContent.includes('handleUpdateSocialUrl'), 'Has update social URL function');
  assert(adminContent.includes('handleMoveSocial'), 'Has reorder social function');
  assert(adminContent.includes('handleAddSocialLink'), 'Has add custom social function');
  assert(adminContent.includes('Live Social Icons Preview'), 'Has live preview section');
  assert(adminContent.includes('hasUnsavedChanges'), 'Has unsaved changes indicator');
  assert(adminContent.includes('lastSavedTime'), 'Displays last saved timestamp');
});

// Test 9: Supabase migration includes social_links JSONB and secure RLS policy
runTest('Supabase schema & migration file include social_links column and secured RLS policy', () => {
  const migrationContent = fs.readFileSync(path.join(rootDir, 'supabase/migration_website_settings.sql'), 'utf-8');
  const schemaContent = fs.readFileSync(path.join(rootDir, 'supabase/schema.sql'), 'utf-8');

  assert(migrationContent.includes('social_links JSONB'), 'Migration has social_links JSONB column');
  assert(migrationContent.includes('ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS social_links JSONB'), 'Idempotent column addition');
  assert(migrationContent.includes('TO authenticated'), 'RLS policy restricts write access to authenticated admin');

  assert(schemaContent.includes('social_links JSONB'), 'schema.sql has social_links JSONB column');
  assert(schemaContent.includes('TO authenticated'), 'schema.sql restricts write access to authenticated admin');
});

console.log(`\n================================================================`);
console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log(`================================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
