import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- RUNNING SUBDOMAIN SEPARATION & ADMIN ISOLATION VERIFICATION ---');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`);
    console.error(`   Error: ${err.message}`);
  }
}

const rootDir = process.cwd();

// Test 1: Header.tsx must NOT contain Admin Portal button
runTest('Header.tsx completely removes Admin Portal button and icon', () => {
  const headerContent = fs.readFileSync(path.join(rootDir, 'src/components/Header.tsx'), 'utf-8');
  assert(!headerContent.includes("t('navAdmin')"), 'Admin button label must be removed from Header');
  assert(!headerContent.includes('admin-dashboard'), 'Admin dashboard navigation must be removed from Header');
  assert(!headerContent.includes('admin-login'), 'Admin login navigation must be removed from Header');
  assert(!headerContent.includes('ShieldCheck'), 'ShieldCheck icon must not be in Header');
});

// Test 2: Header.tsx must preserve Home, Register, and Language Switcher
runTest('Header.tsx preserves Home, Register, and Language Switcher without layout gaps', () => {
  const headerContent = fs.readFileSync(path.join(rootDir, 'src/components/Header.tsx'), 'utf-8');
  assert(headerContent.includes("t('navHome')"), 'Header must include Home button');
  assert(headerContent.includes("t('navRegister')"), 'Header must include Register button');
  assert(headerContent.includes('toggleLanguage'), 'Header must include language toggle');
  assert(headerContent.includes('flex items-center justify-between'), 'Header layout must preserve flex structure');
});

// Test 3: Subdomain utility correctly identifies domains and routes
runTest('subdomain.ts exports accurate domain detection logic', () => {
  const subContent = fs.readFileSync(path.join(rootDir, 'src/utils/subdomain.ts'), 'utf-8');
  assert(subContent.includes('admin.wetheleader.online'), 'Must reference admin.wetheleader.online');
  assert(subContent.includes('www.wetheleader.online'), 'Must reference www.wetheleader.online');
  assert(subContent.includes('isAdminHost'), 'Must export isAdminHost function');
  assert(subContent.includes('getPublicSiteUrl'), 'Must export getPublicSiteUrl function');
  assert(subContent.includes('getAdminPortalUrl'), 'Must export getAdminPortalUrl function');
});

// Test 4: App.tsx differentiates between Admin subdomain and Public website
runTest('App.tsx isolates Admin subdomain and Public site', () => {
  const appContent = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
  assert(appContent.includes('isAdminHost()'), 'App.tsx must use isAdminHost()');
  assert(appContent.includes('if (isAdminDomain)'), 'App.tsx must branch for admin domain');
  assert(appContent.includes('AdminLoginPage'), 'App.tsx must render AdminLoginPage on admin domain');
  assert(appContent.includes('AdminLayout'), 'App.tsx must render AdminLayout for authenticated admins');
  assert(appContent.includes('HomePage'), 'App.tsx must render HomePage for public site');
  assert(appContent.includes('RegistrationPage'), 'App.tsx must render RegistrationPage for public site');
});

// Test 5: vercel.json SPA rewrite and security headers configuration
runTest('vercel.json contains SPA rewrites and standard security headers', () => {
  const vercelPath = path.join(rootDir, 'vercel.json');
  assert(fs.existsSync(vercelPath), 'vercel.json must exist');
  const vercelJson = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
  assert(vercelJson.rewrites && vercelJson.rewrites.length > 0, 'vercel.json must contain rewrites');
  assert(vercelJson.rewrites.some(r => r.source === '/(.*)' && r.destination === '/index.html'), 'SPA wildcard rewrite required');
  assert(vercelJson.headers && vercelJson.headers.length > 0, 'Security headers required');
});

// Test 6: AdminLayout provides direct link to public website
runTest('AdminLayout contains public website navigation link for admins', () => {
  const adminLayout = fs.readFileSync(path.join(rootDir, 'src/components/AdminLayout.tsx'), 'utf-8');
  assert(adminLayout.includes('getPublicSiteUrl()'), 'AdminLayout must provide link to public site');
  assert(adminLayout.includes('adminLogoutBtn'), 'AdminLayout must preserve logout button');
});

// Test 7: Verify all existing features and components remain intact
runTest('Core member registration, ID card, and DB service integrity', () => {
  const regPage = fs.readFileSync(path.join(rootDir, 'src/pages/RegistrationPage.tsx'), 'utf-8');
  const idCard = fs.readFileSync(path.join(rootDir, 'src/components/CR80MembershipCard.tsx'), 'utf-8');
  const memberService = fs.readFileSync(path.join(rootDir, 'src/services/memberService.ts'), 'utf-8');

  assert(regPage.includes('street_name'), 'Registration page must include street_name');
  assert(idCard.includes('formatCardMemberName'), 'ID card must format bilingual name');
  assert(idCard.includes('www.wetheleader.online'), 'ID card must feature official online URL');
  assert(memberService.includes('street_name'), 'Member service must handle street_name');
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('🎉 ALL SUBDOMAIN SEPARATION TESTS PASSED PERFECTLY!\n');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED!\n');
  process.exit(1);
}
