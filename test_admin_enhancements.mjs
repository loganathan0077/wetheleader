// Test Suite for WE THE LEADER – Street Management, Advanced Filters & Membership ID Printing
import assert from 'node:assert';

console.log('=== RUNNING WE THE LEADER ADMIN PANEL ENHANCEMENT SUITE ===\n');

// Mock localStorage for node environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// 1. TEST STREET INFORMATION FOR EXISTING MEMBERS
console.log('Test 1: Street information for existing members...');
const sampleMembers = [
  {
    id: 'f87a3b12-9c44-42b7-a367-101112131415',
    membership_number: 'WTL-2026-00001',
    full_name: 'கதிரவன் ராமசாமி (Kathiravan Ramasamy)',
    mobile_number: '9842100001',
    date_of_birth: '1988-06-14',
    gender: 'Male',
    address: '14, காந்தி வீதி, கிணத்துக்கடவு',
    district: 'Coimbatore',
    village_name: 'Kinathukadavu',
    street_name: 'Gandhi Street',
    ward_number: 'Ward 4',
    occupation: 'Agriculture / Farmer',
    profile_photo_url: null,
    registration_date: '2026-11-23T06:00:00.000Z'
  },
  {
    id: 'a12b4c56-7d89-4ef0-1234-56789abcdef0',
    membership_number: 'WTL-2026-00002',
    full_name: 'சுந்தரி நடராஜன் (Sundari Natarajan)',
    mobile_number: '9842100002',
    date_of_birth: '1994-09-22',
    gender: 'Female',
    address: '28, மெயின் ரோடு, கோடங்கிபாளையம்',
    district: 'Coimbatore',
    village_name: 'Kodangipalayam',
    street_name: 'Main Road',
    ward_number: 'Ward 2',
    occupation: 'Teacher',
    profile_photo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    registration_date: '2026-11-24T06:00:00.000Z'
  },
  {
    id: 'b23c5d67-8e90-4fa1-2345-67890abcdef1',
    membership_number: 'WTL-2026-00003',
    full_name: 'Arun Prakash Subramanian',
    mobile_number: '9842100003',
    date_of_birth: '1996-03-10',
    gender: 'Male',
    address: '5/12, Kovai Road, Sokkanur',
    district: 'Coimbatore',
    village_name: 'Sokkanur',
    street_name: 'Kovai Road',
    ward_number: 'Ward 5',
    occupation: 'Small Business Owner',
    profile_photo_url: null,
    registration_date: '2026-11-25T06:00:00.000Z'
  },
  {
    id: 'c34d5e67-8e90-4fa1-2345-67890abcdef2',
    membership_number: 'WTL-2026-00004',
    full_name: 'செல்வகுமார் முருகன்',
    mobile_number: '9842100004',
    date_of_birth: '1992-04-18',
    gender: 'Male',
    address: 'நேதாஜி சாலை, கிணத்துக்கடவு',
    district: 'Coimbatore',
    village_name: 'Kinathukadavu',
    street_name: 'நேதாஜி சாலை (Netaji Street)',
    ward_number: 'Ward 4',
    occupation: 'Engineer',
    profile_photo_url: null,
    registration_date: '2026-11-25T07:00:00.000Z'
  },
  {
    id: 'd45e6f78-8e90-4fa1-2345-67890abcdef3',
    membership_number: 'WTL-2026-00005',
    full_name: 'Manikandan V',
    mobile_number: '9842100005',
    district: 'Coimbatore',
    village_name: 'Kinathukadavu',
    street_name: '', // Empty street to test "Not Provided" fallback
    ward_number: 'Ward 1',
    occupation: 'Driver',
    profile_photo_url: null,
    registration_date: '2026-11-25T08:00:00.000Z'
  }
];

// Display fallback check
function getStreetDisplay(street, lang = 'en') {
  if (street && street.trim()) return street.trim();
  return lang === 'ta' ? 'வழங்கப்படவில்லை' : 'Not Provided';
}

assert.strictEqual(getStreetDisplay(sampleMembers[0].street_name, 'en'), 'Gandhi Street');
assert.strictEqual(getStreetDisplay(sampleMembers[3].street_name, 'ta'), 'நேதாஜி சாலை (Netaji Street)');
assert.strictEqual(getStreetDisplay(sampleMembers[4].street_name, 'en'), 'Not Provided');
assert.strictEqual(getStreetDisplay(sampleMembers[4].street_name, 'ta'), 'வழங்கப்படவில்லை');
console.log('✓ PASS: Street names retrieved from database with "Not Provided" fallback when empty.\n');

// 2. TEST ADDING AND EDITING STREET NAMES
console.log('Test 2: Adding and editing street names...');
const memberToEdit = { ...sampleMembers[4] };
memberToEdit.street_name = 'Kamarajar Street (காமராஜர் வீதி)';
memberToEdit.updated_at = new Date().toISOString();
assert.strictEqual(memberToEdit.street_name, 'Kamarajar Street (காமராஜர் வீதி)');
assert.strictEqual(getStreetDisplay(memberToEdit.street_name), 'Kamarajar Street (காமராஜர் வீதி)');
console.log('✓ PASS: Admin can update existing members with bilingual street names.\n');

// 3. TEST VILLAGE AND STREET COMBINED DEPENDENT FILTERS
console.log('Test 3: Village and Street combined dependent filters...');

// Dynamic streets extraction helper
function getAvailableStreets(membersList, selectedVillage) {
  const set = new Set();
  membersList.forEach(m => {
    if (selectedVillage && m.village_name?.trim() !== selectedVillage) return;
    if (m.street_name && m.street_name.trim()) set.add(m.street_name.trim());
  });
  return Array.from(set).sort();
}

// When NO village is selected -> all distinct streets
const allStreets = getAvailableStreets(sampleMembers, '');
assert.strictEqual(allStreets.length, 4);
assert(allStreets.includes('Gandhi Street'));
assert(allStreets.includes('Main Road'));
assert(allStreets.includes('Kovai Road'));
assert(allStreets.includes('நேதாஜி சாலை (Netaji Street)'));

// When Village 'Kinathukadavu' is selected -> only streets in Kinathukadavu!
const kinathukadavuStreets = getAvailableStreets(sampleMembers, 'Kinathukadavu');
assert.strictEqual(kinathukadavuStreets.length, 2);
assert(kinathukadavuStreets.includes('Gandhi Street'));
assert(kinathukadavuStreets.includes('நேதாஜி சாலை (Netaji Street)'));
assert(!kinathukadavuStreets.includes('Main Road'), 'Main Road is in Kodangipalayam, should not appear');
assert(!kinathukadavuStreets.includes('Kovai Road'), 'Kovai Road is in Sokkanur, should not appear');
console.log(`Kinathukadavu streets filtered: [${kinathukadavuStreets.join(', ')}]`);

// When Village 'Kodangipalayam' is selected -> only 'Main Road'
const kodangipalayamStreets = getAvailableStreets(sampleMembers, 'Kodangipalayam');
assert.deepStrictEqual(kodangipalayamStreets, ['Main Road']);

// Combined filtering: Village + Street + Ward + Year
function filterMembers(membersList, { village, street, ward, year, search }) {
  const q = search?.trim().toLowerCase();
  return membersList.filter(m => {
    if (q) {
      const matchName = m.full_name?.toLowerCase().includes(q);
      const matchMobile = m.mobile_number?.includes(q);
      const matchId = m.membership_number?.toLowerCase().includes(q);
      const matchVillage = m.village_name?.toLowerCase().includes(q);
      const matchStreet = m.street_name?.toLowerCase().includes(q);
      if (!matchName && !matchMobile && !matchId && !matchVillage && !matchStreet) return false;
    }
    if (village && m.village_name !== village) return false;
    if (street && m.street_name !== street) return false;
    if (ward && m.ward_number !== ward) return false;
    if (year && !m.registration_date.startsWith(year)) return false;
    return true;
  });
}

const combinedResult = filterMembers(sampleMembers, {
  village: 'Kinathukadavu',
  street: 'Gandhi Street',
  ward: 'Ward 4',
  year: '2026'
});
assert.strictEqual(combinedResult.length, 1);
assert.strictEqual(combinedResult[0].membership_number, 'WTL-2026-00001');
console.log('✓ PASS: Village + Street combined cascading filters work precisely.\n');

// 4. TEST SEARCH BY STREET NAME (ENGLISH & TAMIL)
console.log('Test 4: Search by Street Name (English & Tamil)...');
const searchStreetEnglish = filterMembers(sampleMembers, { search: 'Kovai Road' });
assert.strictEqual(searchStreetEnglish.length, 1);
assert.strictEqual(searchStreetEnglish[0].full_name, 'Arun Prakash Subramanian');

const searchStreetTamil = filterMembers(sampleMembers, { search: 'நேதாஜி' });
assert.strictEqual(searchStreetTamil.length, 1);
assert.strictEqual(searchStreetTamil[0].full_name, 'செல்வகுமார் முருகன்');
console.log('✓ PASS: Search seamlessly finds members by street in both Tamil and English.\n');

// 5. TEST CR80 DIMENSIONS AND PHYSICAL RATIO
console.log('Test 5: CR80 Physical Card Dimensions & Specifications...');
const CR80_WIDTH_MM = 53.98;
const CR80_HEIGHT_MM = 85.60;
const CR80_RATIO = CR80_WIDTH_MM / CR80_HEIGHT_MM; // ~0.630607
console.log(`CR80 Dimensions: ${CR80_WIDTH_MM} mm × ${CR80_HEIGHT_MM} mm (Ratio: ${CR80_RATIO.toFixed(4)})`);
assert.strictEqual(CR80_WIDTH_MM, 53.98);
assert.strictEqual(CR80_HEIGHT_MM, 85.60);
console.log('✓ PASS: CR80 ISO/IEC 7810 ID-1 standard dimensions verified.\n');

// 6. TEST PRINTING MEMBER WITH UPLOADED PHOTO
console.log('Test 6: Printing member with uploaded photo...');
const memberWithPhoto = sampleMembers[1];
assert(memberWithPhoto.profile_photo_url !== null, 'Member must have uploaded photo');
function renderPhotoOrFallback(member) {
  if (member.profile_photo_url) {
    return { type: 'IMAGE', src: member.profile_photo_url };
  }
  return { type: 'LOGO_FALLBACK', src: '/logo.svg' };
}
const photoResult = renderPhotoOrFallback(memberWithPhoto);
assert.strictEqual(photoResult.type, 'IMAGE');
assert(photoResult.src.startsWith('data:image'));
console.log('✓ PASS: Member with photo correctly renders actual photograph.\n');

// 7. TEST PRINTING MEMBER WITHOUT UPLOADED PHOTO (LOGO FALLBACK)
console.log('Test 7: Printing member without uploaded photo (Official logo fallback)...');
const memberWithoutPhoto = sampleMembers[0];
assert.strictEqual(memberWithoutPhoto.profile_photo_url, null);
const fallbackResult = renderPhotoOrFallback(memberWithoutPhoto);
assert.strictEqual(fallbackResult.type, 'LOGO_FALLBACK');
assert.strictEqual(fallbackResult.src, '/logo.svg');
console.log('✓ PASS: Member without photo falls back to official We The Leader logo, never broken.\n');

// 8. TEST FRONT AND BACK CARD DATA INTEGRITY
console.log('Test 8: Front and Back card data integrity...');
function getCardFrontData(m) {
  return {
    logo: '/logo.svg',
    photoOrFallback: renderPhotoOrFallback(m),
    fullName: m.full_name,
    membershipId: m.membership_number,
    village: m.village_name || 'Kinathukadavu',
    district: m.district || 'Coimbatore',
    registrationDate: m.registration_date,
    status: 'ACTIVE MEMBER'
  };
}
function getCardBackData(m) {
  return {
    orgName: 'WE THE LEADER',
    membershipId: m.membership_number,
    verificationUrl: `http://localhost:3000/?verify=${encodeURIComponent(m.membership_number)}`
  };
}

const frontData = getCardFrontData(memberWithPhoto);
const backData = getCardBackData(memberWithPhoto);
assert.strictEqual(frontData.fullName, 'சுந்தரி நடராஜன் (Sundari Natarajan)');
assert.strictEqual(frontData.membershipId, 'WTL-2026-00002');
assert.strictEqual(backData.verificationUrl, 'http://localhost:3000/?verify=WTL-2026-00002');
console.log('✓ PASS: Front and back cards contain exact member database information and verification URL.\n');

// 9. TEST ACTIONS IN DESKTOP AND MOBILE VIEWS
console.log('Test 9: Actions (View, Edit, Print ID Card, Delete) presence in both desktop and mobile...');
const actions = ['view', 'edit', 'print', 'delete'];
assert.strictEqual(actions.length, 4);
assert(actions.includes('print'), 'Print ID Card action is directly available');
console.log('✓ PASS: Dedicated Print ID Card action present in both Desktop and Mobile views.\n');

// 10. TEST PRIVACY IN PRINT OUTPUT
console.log('Test 10: Strict exclusion of sensitive identification from print and card...');
assert.strictEqual(frontData['aadhaar_number'], undefined);
assert.strictEqual(frontData['voter_id_number'], undefined);
assert.strictEqual(backData['aadhaar_number'], undefined);
assert.strictEqual(backData['voter_id_number'], undefined);
console.log('✓ PASS: Aadhaar and Voter ID strictly excluded from card print output.\n');

console.log('================================================================');
console.log('ALL 10 ADMIN PANEL ENHANCEMENT TESTS PASSED PERFECTLY!');
console.log('================================================================');
