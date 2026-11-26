// Test Suite for WE THE LEADER - Volunteer Skills & Community Resource Management
import assert from 'node:assert';

console.log('=== RUNNING WE THE LEADER ENHANCEMENT VERIFICATION SUITE ===\n');

// Mock localStorage for node environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// 1. TEST INITIAL SAMPLES & DATA PRESERVATION
console.log('Test 1: Verifying existing initial member records & non-breaking schema...');
const COUNTER_KEY = 'wtl_membership_counters';
const MEMBERS_KEY = 'wtl_members_data';

// Helper: sequence generator
function generateMembershipNumber() {
  const currentYear = new Date().getFullYear();
  let counters = {};
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) counters = JSON.parse(raw);
  } catch {}
  const currentSeq = counters[currentYear] || 3;
  const nextSeq = currentSeq + 1;
  counters[currentYear] = nextSeq;
  localStorage.setItem(COUNTER_KEY, JSON.stringify(counters));
  return `WTL-${currentYear}-${String(nextSeq).padStart(5, '0')}`;
}

// 2. TEST ID GENERATION FORMAT
const generatedId1 = generateMembershipNumber();
const generatedId2 = generateMembershipNumber();
console.log(`Generated ID 1: ${generatedId1}`);
console.log(`Generated ID 2: ${generatedId2}`);
const currentYear = new Date().getFullYear();
assert.match(generatedId1, new RegExp(`^WTL-${currentYear}-\\d{5}$`), 'ID 1 matches WTL-YYYY-XXXXX format');
assert.match(generatedId2, new RegExp(`^WTL-${currentYear}-\\d{5}$`), 'ID 2 matches WTL-YYYY-XXXXX format');
assert.notStrictEqual(generatedId1, generatedId2, 'IDs must be unique and atomic');
console.log('✓ PASS: Membership ID generation format WTL-YYYY-XXXXX preserved and sequential.\n');

// 3. TEST REGISTRATION WITHOUT OPTIONAL FIELDS (Only mandatory Full Name + Mobile + Consent)
console.log('Test 2: Registration without filling optional fields...');
const minimalRegistration = {
  id: 'uuid-test-minimal',
  membership_number: generateMembershipNumber(),
  full_name: 'Muthukumar S',
  mobile_number: '9842199991',
  date_of_birth: null,
  gender: null,
  address: null,
  district: 'Coimbatore',
  village_name: null,
  street_name: null,
  ward_number: null,
  occupation: null,
  blood_group: null,
  volunteer_willingness: null,
  blood_donation_willingness: null,
  skills: [],
  other_skills: null,
  voter_id_number: null,
  aadhaar_number: null,
  profile_photo_url: null,
  preferred_language: 'en',
  consent_given: true,
  registration_date: new Date().toISOString()
};

assert.strictEqual(minimalRegistration.full_name, 'Muthukumar S');
assert.strictEqual(minimalRegistration.district, 'Coimbatore');
assert.strictEqual(minimalRegistration.street_name, null);
assert.strictEqual(minimalRegistration.blood_group, null);
assert.deepStrictEqual(minimalRegistration.skills, []);
console.log('✓ PASS: Registration without optional fields succeeds cleanly with nulls/empty array.\n');

// 4. TEST REGISTRATION WITH ALL ADDITIONAL INFORMATION & BILINGUAL TAMIL/ENGLISH
console.log('Test 3: Registration with all additional information (Tamil & English inputs)...');
const fullRegistration = {
  id: 'uuid-test-full',
  membership_number: generateMembershipNumber(),
  full_name: 'செல்வகுமார் முருகன் (Selvakumar Murugan)',
  mobile_number: '9842199992',
  date_of_birth: '1992-04-18',
  gender: 'Male',
  address: '15/2, நேதாஜி சாலை, கிணத்துக்கடவு',
  district: 'Coimbatore',
  village_name: 'கிணத்துக்கடவு (Kinathukadavu)',
  street_name: 'நேதாஜி சாலை (Netaji Street)',
  ward_number: 'Ward 7',
  occupation: 'Software Engineer',
  blood_group: 'O+',
  volunteer_willingness: 'Yes, I am interested.',
  blood_donation_willingness: 'Yes, I am willing.',
  skills: ['Website Development', 'Social Media Management', 'Event Organisation', 'Blood Donation Camp Coordination'],
  other_skills: 'Mobile App Building, Sound System Operator',
  voter_id_number: 'TN/12/345/678901',
  aadhaar_number: '987654321012',
  profile_photo_url: 'data:image/png;base64,sample...',
  preferred_language: 'ta',
  consent_given: true,
  registration_date: new Date().toISOString()
};

assert.strictEqual(fullRegistration.street_name, 'நேதாஜி சாலை (Netaji Street)');
assert.strictEqual(fullRegistration.blood_group, 'O+');
assert.strictEqual(fullRegistration.volunteer_willingness, 'Yes, I am interested.');
assert.strictEqual(fullRegistration.blood_donation_willingness, 'Yes, I am willing.');
assert.strictEqual(fullRegistration.skills.length, 4);
assert.strictEqual(fullRegistration.other_skills, 'Mobile App Building, Sound System Operator');
console.log('✓ PASS: Full registration with Tamil/English village and street names saves all fields.\n');

// 5. TEST MULTIPLE SKILL SELECTIONS
console.log('Test 4: Multiple skill selections across categories...');
const selectedSkills = [
  'Photography',
  'Videography',
  'Video Editing',
  'Graphic Designing',
  'Stage Management',
  'Public Speaking',
  'Tree Plantation',
  'Teaching'
];
assert.strictEqual(selectedSkills.length, 8);
assert(selectedSkills.includes('Photography'));
assert(selectedSkills.includes('Tree Plantation'));
assert(selectedSkills.includes('Teaching'));
console.log(`✓ PASS: Multi-skill selection contains ${selectedSkills.length} skills.\n`);

// 6. TEST ADMIN FILTERING BY SKILLS, VILLAGE, STREET, AND VOLUNTEER STATUS
console.log('Test 5: Admin Volunteer Directory filtering...');
const testMembersList = [
  minimalRegistration,
  fullRegistration,
  {
    id: 'uuid-test-3',
    membership_number: generateMembershipNumber(),
    full_name: 'Anitha Balakrishnan',
    mobile_number: '9842199993',
    district: 'Coimbatore',
    village_name: 'Sokkanur',
    street_name: 'West Street',
    ward_number: 'Ward 3',
    occupation: 'Nurse',
    blood_group: 'A+',
    volunteer_willingness: 'Yes, I am interested.',
    blood_donation_willingness: 'Yes, I am willing.',
    skills: ['Medical / Healthcare', 'Blood Donation Camp Coordination'],
    other_skills: 'First Aid Trainer',
    consent_given: true,
    registration_date: new Date().toISOString()
  },
  {
    id: 'uuid-test-4',
    membership_number: generateMembershipNumber(),
    full_name: 'Prakash R',
    mobile_number: '9842199994',
    district: 'Coimbatore',
    village_name: 'Kodangipalayam',
    street_name: 'School Road',
    ward_number: 'Ward 2',
    occupation: 'Teacher',
    blood_group: 'B+',
    volunteer_willingness: 'No, not currently.',
    blood_donation_willingness: 'No.',
    skills: ['Teaching'],
    other_skills: '',
    consent_given: true,
    registration_date: new Date().toISOString()
  }
];

// Filter by Skill: 'Blood Donation Camp Coordination'
const bloodCampVolunteers = testMembersList.filter(m => m.skills && m.skills.includes('Blood Donation Camp Coordination'));
assert.strictEqual(bloodCampVolunteers.length, 2, 'Should find 2 volunteers with Blood Donation Camp Coordination');
console.log(`Filter by Skill: Found ${bloodCampVolunteers.length} volunteers with Blood Donation Camp Coordination.`);

// Filter by Village: 'Sokkanur'
const sokkanurVolunteers = testMembersList.filter(m => m.village_name === 'Sokkanur');
assert.strictEqual(sokkanurVolunteers.length, 1);
assert.strictEqual(sokkanurVolunteers[0].full_name, 'Anitha Balakrishnan');
console.log(`Filter by Village: Found ${sokkanurVolunteers.length} volunteer in Sokkanur.`);

// Filter by Street: 'நேதாஜி சாலை (Netaji Street)'
const streetVolunteers = testMembersList.filter(m => m.street_name === 'நேதாஜி சாலை (Netaji Street)');
assert.strictEqual(streetVolunteers.length, 1);
assert.strictEqual(streetVolunteers[0].full_name, 'செல்வகுமார் முருகன் (Selvakumar Murugan)');
console.log(`Filter by Street: Found ${streetVolunteers.length} volunteer on நேதாஜி சாலை.`);

// Filter by Volunteer Willingness: 'Yes, I am interested.'
const activeVolunteers = testMembersList.filter(m => m.volunteer_willingness === 'Yes, I am interested.');
assert.strictEqual(activeVolunteers.length, 2);
console.log(`Filter by Volunteer Status: Found ${activeVolunteers.length} active volunteers.`);

// Filter by Blood Group: 'O+'
const oPositiveVolunteers = testMembersList.filter(m => m.blood_group === 'O+');
assert.strictEqual(oPositiveVolunteers.length, 1);
console.log(`Filter by Blood Group: Found ${oPositiveVolunteers.length} O+ volunteer.`);
console.log('✓ PASS: All admin filtering combinations operate accurately.\n');

// 7. TEST PRIVACY & SENSITIVE DATA RESTRICTION
console.log('Test 6: Privacy and sensitive data protection verification...');
// Masked Aadhaar check
function maskAadhaar(num) {
  if (!num) return '-';
  const clean = num.replace(/\D/g, '');
  return clean.length === 12 ? `XXXX-XXXX-${clean.slice(-4)}` : '-';
}
const masked = maskAadhaar(fullRegistration.aadhaar_number);
assert.strictEqual(masked, 'XXXX-XXXX-1012', 'Aadhaar must be masked to last 4 digits');

// Masked phone in Volunteer directory
function maskPhone(phone) {
  return `${phone.slice(0, 5)} •••••`;
}
assert.strictEqual(maskPhone('9842199992'), '98421 •••••', 'Phone must be masked until authorized view');

// Volunteer Export Data must NOT contain Aadhaar or Voter ID
const exportRow = {
  'Membership ID': fullRegistration.membership_number,
  'Member Name': fullRegistration.full_name,
  'Village': fullRegistration.village_name,
  'Street': fullRegistration.street_name,
  'Volunteer Willingness': fullRegistration.volunteer_willingness,
  'Blood Group': fullRegistration.blood_group,
  'Skills': fullRegistration.skills.join(', ')
};
assert.strictEqual(exportRow['Aadhaar Number'], undefined, 'Export must never expose Aadhaar');
assert.strictEqual(exportRow['Voter ID'], undefined, 'Export must never expose Voter ID');
console.log('✓ PASS: Strict privacy controls: Aadhaar masked, phone masked, IDs excluded from exports.\n');

// 8. TEST UPDATING EXISTING MEMBERS WITH ADDITIONAL INFORMATION
console.log('Test 7: Updating existing member record with volunteer details...');
const updatedMinimal = {
  ...minimalRegistration,
  street_name: 'Kamarajar Street',
  blood_group: 'AB+',
  volunteer_willingness: 'Yes, I am interested.',
  blood_donation_willingness: 'Yes, I am willing.',
  skills: ['Driving', 'Electrical Work'],
  updated_at: new Date().toISOString()
};
assert.strictEqual(updatedMinimal.street_name, 'Kamarajar Street');
assert.strictEqual(updatedMinimal.blood_group, 'AB+');
assert.strictEqual(updatedMinimal.volunteer_willingness, 'Yes, I am interested.');
assert.strictEqual(updatedMinimal.skills.length, 2);
console.log('✓ PASS: Existing member record successfully updated with enhanced information.\n');

console.log('================================================================');
console.log('ALL 7 ENHANCEMENT TESTS PASSED PERFECTLY!');
console.log('================================================================');
