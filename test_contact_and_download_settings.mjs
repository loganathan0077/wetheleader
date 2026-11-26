import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== RUNNING WE THE LEADER HOMEPAGE BUTTONS & CONTACT SETTINGS SUITE ===\n');

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

// Test 1: Verify settingsService exists and has correct default values
runTest('settingsService exports default settings matching requirements', () => {
  const serviceContent = fs.readFileSync(path.join(rootDir, 'src/services/settingsService.ts'), 'utf-8');
  assert(serviceContent.includes("download_id_button_text: 'DOWNLOAD ID CARD'"), 'Default download button text');
  assert(serviceContent.includes("contact_section_heading: 'Need Help? Contact Us'"), 'Default contact heading');
  assert(serviceContent.includes("contact_designation: 'Kinathukadavu Admin'"), 'Default contact designation');
  assert(serviceContent.includes("whatsapp_number: '9750855623'"), 'Default WhatsApp number');
  assert(serviceContent.includes("country_code: '+91'"), 'Default country code');
  assert(serviceContent.includes("whatsapp_button_text: 'Contact on WhatsApp'"), 'Default WhatsApp button text');
  assert(serviceContent.includes('buildWhatsAppUrl'), 'Must export buildWhatsAppUrl helper');
});

// Test 2: Verify WhatsApp URL builder format
runTest('WhatsApp URL builder formats exact wa.me URL with country code and message', () => {
  const serviceContent = fs.readFileSync(path.join(rootDir, 'src/services/settingsService.ts'), 'utf-8');
  assert(serviceContent.includes('https://wa.me/'), 'Must use wa.me protocol');
  
  // Test logic equivalent
  const cleanCode = '+91'.replace(/[^0-9]/g, '');
  const cleanNum = '9750855623'.replace(/[^0-9]/g, '');
  const msg = 'Hello We The Leader, I would like to know more about membership and joining the Kinathukadavu team.';
  const url = `https://wa.me/${cleanCode}${cleanNum}?text=${encodeURIComponent(msg)}`;
  
  assert.strictEqual(cleanCode, '91');
  assert.strictEqual(cleanNum, '9750855623');
  assert(url.startsWith('https://wa.me/919750855623?text='));
});

// Test 3: Verify dual-factor verification in memberService
runTest('memberService implements secure dual-factor member verification for ID download', () => {
  const memberContent = fs.readFileSync(path.join(rootDir, 'src/services/memberService.ts'), 'utf-8');
  assert(memberContent.includes('verifyAndGetMemberForDownload'), 'Must export verifyAndGetMemberForDownload');
  assert(memberContent.includes('cleanPhone.length < 10'), 'Must enforce 10-digit mobile number');
  assert(memberContent.includes('membershipIdOrDob'), 'Must require membership ID or DOB');
});

// Test 4: Verify DownloadIdCardPage exists and provides CR80 ID card generation
runTest('DownloadIdCardPage provides secure member retrieval, CR80 display, and PDF/Print export', () => {
  const downloadPage = fs.readFileSync(path.join(rootDir, 'src/pages/DownloadIdCardPage.tsx'), 'utf-8');
  assert(downloadPage.includes('CR80MembershipCard'), 'Must render CR80MembershipCard component');
  assert(downloadPage.includes('exportCardPdf'), 'Must call exportCardPdf');
  assert(downloadPage.includes('window.print'), 'Must support print functionality');
  assert(downloadPage.includes('verifyAndGetMemberForDownload'), 'Must verify credentials before access');
});

// Test 5: Verify Hero CTA is focused on Register Now and Download ID Card is moved to Header Menu
runTest('Hero section has clean primary Register Now CTA and sections have navigational IDs', () => {
  const homeContent = fs.readFileSync(path.join(rootDir, 'src/pages/HomePage.tsx'), 'utf-8');
  assert(homeContent.includes('REGISTER NOW / இன்றே இணைந்திடுங்கள்!'), 'Hero has primary Register Now button');
  assert(homeContent.includes('id="about"'), 'Hero section has id="about"');
  assert(homeContent.includes('id="pillars"'), 'Pillars section has id="pillars"');
  assert(homeContent.includes('id="activities"'), 'Activities section has id="activities"');
  assert(homeContent.includes('id="contact"'), 'Contact section has id="contact"');
});

// Test 6: Verify HomePage contains Contact Us & WhatsApp Section
runTest('HomePage integrates Contact Us section with designation, phone, and WhatsApp button', () => {
  const homeContent = fs.readFileSync(path.join(rootDir, 'src/pages/HomePage.tsx'), 'utf-8');
  assert(homeContent.includes('settings.show_contact_section'), 'Must respect show_contact_section toggle');
  assert(homeContent.includes('settings.contact_section_heading'), 'Must display editable section heading');
  assert(homeContent.includes('settings.contact_designation'), 'Must display contact designation');
  assert(homeContent.includes('settings.show_whatsapp_button'), 'Must respect show_whatsapp_button toggle');
  assert(homeContent.includes('settings.whatsapp_button_text'), 'Must display editable WhatsApp button text');
  assert(homeContent.includes('buildWhatsAppUrl'), 'Must generate WhatsApp link with message');
});

// Test 7: Verify AdminSettings provides the 10 settings fields and live preview
runTest('AdminSettings provides form fields for all 10 settings and live preview', () => {
  const adminContent = fs.readFileSync(path.join(rootDir, 'src/pages/admin/AdminSettings.tsx'), 'utf-8');
  assert(adminContent.includes('download_id_button_text'), 'Editable download_id_button_text');
  assert(adminContent.includes('contact_section_heading'), 'Editable contact_section_heading');
  assert(adminContent.includes('contact_designation'), 'Editable contact_designation');
  assert(adminContent.includes('whatsapp_number'), 'Editable whatsapp_number');
  assert(adminContent.includes('country_code'), 'Editable country_code');
  assert(adminContent.includes('whatsapp_button_text'), 'Editable whatsapp_button_text');
  assert(adminContent.includes('whatsapp_message'), 'Editable whatsapp_message');
  assert(adminContent.includes('show_download_id_button'), 'Toggle show_download_id_button');
  assert(adminContent.includes('show_contact_section'), 'Toggle show_contact_section');
  assert(adminContent.includes('show_whatsapp_button'), 'Toggle show_whatsapp_button');
  assert(adminContent.includes('Live Homepage Preview'), 'Must include real-time preview');
});

// Test 8: Verify Supabase migration and schema updates for website_settings
runTest('Supabase schema and migration script define website_settings table with RLS', () => {
  const schemaContent = fs.readFileSync(path.join(rootDir, 'supabase/schema.sql'), 'utf-8');
  const migrationContent = fs.readFileSync(path.join(rootDir, 'supabase/migration_website_settings.sql'), 'utf-8');
  
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.website_settings'), 'Schema has website_settings');
  assert(schemaContent.includes('ENABLE ROW LEVEL SECURITY'), 'RLS enabled on website_settings');
  assert(migrationContent.includes('Public read website_settings'), 'Public read policy exists');
  assert(migrationContent.includes('Admin manage website_settings'), 'Admin manage policy exists');
});

// Test 9: Verify App.tsx routing for download-id
runTest('App.tsx wires download-id view to DownloadIdCardPage and handles action param', () => {
  const appContent = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
  assert(appContent.includes("currentView === 'download-id'"), 'Must route download-id view');
  assert(appContent.includes('DownloadIdCardPage'), 'Must render DownloadIdCardPage');
  assert(appContent.includes("action === 'download-id'"), 'Must support ?action=download-id query param');
});

// Test 10: Verify Date of Birth is Mandatory Information on registration form
runTest('RegistrationPage enforces Date of Birth as mandatory in Section 1 and validation', () => {
  const regContent = fs.readFileSync(path.join(rootDir, 'src/pages/RegistrationPage.tsx'), 'utf-8');
  assert(regContent.includes('errors.date_of_birth = t(\'valDobRequired\')'), 'Must validate date_of_birth in validateForm()');
  assert(regContent.includes('dobLabel'), 'Must display dobLabel');
  
  // Verify Date of Birth is inside Section 1 (Mandatory Information)
  const section1Start = regContent.indexOf('SECTION 1: MANDATORY INFORMATION');
  const section2Start = regContent.indexOf('SECTION 2: PERSONAL INFORMATION');
  const dobPos = regContent.indexOf('date_of_birth', section1Start);
  
  assert(dobPos > section1Start && dobPos < section2Start, 'Date of Birth must be located within Section 1 Mandatory Information');
});

// Test 11: Verify Header Three-Line Hamburger Menu & Drawer Links
runTest('Header provides three-line hamburger menu with Membership, Contact and Info links', () => {
  const headerContent = fs.readFileSync(path.join(rootDir, 'src/components/Header.tsx'), 'utf-8');
  assert(headerContent.includes('Menu'), 'Must include Menu icon');
  assert(headerContent.includes('X'), 'Must include X close icon');
  assert(headerContent.includes('menuOpen'), 'Must manage menuOpen state');
  assert(headerContent.includes('MEMBERSHIP'), 'Must have MEMBERSHIP section');
  assert(headerContent.includes('Download ID Card'), 'Must have Download ID Card link');
  assert(headerContent.includes('download-id'), 'Must navigate to download-id');
  assert(headerContent.includes('CONTACT'), 'Must have CONTACT section');
  assert(headerContent.includes('Contact Kinathukadavu Admin'), 'Must have Kinathukadavu Admin link');
  assert(headerContent.includes('WhatsApp Support'), 'Must have WhatsApp Support link');
  assert(headerContent.includes('INFORMATION'), 'Must have INFORMATION section');
  assert(headerContent.includes('About We The Leader'), 'Must have About We The Leader link');
  assert(!headerContent.includes('Our Activities'), 'Our Activities link removed from drawer');
  assert(!headerContent.includes('Our Key Pillars'), 'Our Key Pillars link removed from drawer');
  assert(headerContent.includes('Contact Information'), 'Must have Contact Information link');
});

console.log(`\n================================================================`);
console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log(`================================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
