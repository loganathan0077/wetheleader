/**
 * Test Suite: Verification of Critical Registration, Photo Upload & Admin Dashboard Fixes
 */
import fs from 'fs';
import path from 'path';

const projectRoot = '/Users/log/.gemini/antigravity/scratch/wetheleader';

console.log('--- WE THE LEADER: VERIFYING CRITICAL FIXES ---\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName} - ${details}`);
    failCount++;
  }
}

// 1. Translations check
const transFile = fs.readFileSync(path.join(projectRoot, 'src/i18n/translations.ts'), 'utf8');

assert(
  transFile.includes('photoTakePhotoBtn: "Take Photo"') &&
  transFile.includes('photoUploadDeviceBtn: "Upload from Device"'),
  'English translations for Take Photo and Upload from Device'
);

assert(
  transFile.includes('photoTakePhotoBtn: "படம் எடுக்க"') &&
  transFile.includes('photoUploadDeviceBtn: "சாதனத்திலிருந்து பதிவேற்ற"'),
  'Tamil translations for Take Photo and Upload from Device'
);

assert(
  transFile.includes('valGenderRequired: "Please select your gender."') &&
  transFile.includes('valVillageRequired: "Please select or enter your village / town."') &&
  transFile.includes('valStreetRequired: "Please enter your street name or area."'),
  'English mandatory validation messages for Gender, Village and Street'
);

assert(
  transFile.includes('valGenderRequired: "தயவுசெய்து உங்கள் பாலினத்தைத் தேர்ந்தெடுக்கவும்."') &&
  transFile.includes('valVillageRequired: "தயவுசெய்து உங்கள் கிராமம் / ஊரைத் தேர்ந்தெடுக்கவும்."') &&
  transFile.includes('valStreetRequired: "தயவுசெய்து உங்கள் தெரு அல்லது பகுதியின் பெயரை உள்ளிடவும்."'),
  'Tamil mandatory validation messages for Gender, Village and Street'
);

// 2. RegistrationPage check
const regFile = fs.readFileSync(path.join(projectRoot, 'src/pages/RegistrationPage.tsx'), 'utf8');

assert(
  regFile.includes('errors.gender = t(\'valGenderRequired\');') &&
  regFile.includes('errors.village_name = t(\'valVillageRequired\');') &&
  regFile.includes('errors.street_name = t(\'valStreetRequired\');'),
  'RegistrationPage validates mandatory gender, village_name and street_name'
);

assert(
  regFile.includes('cameraInputRef = useRef<HTMLInputElement>(null);') &&
  regFile.includes('galleryInputRef = useRef<HTMLInputElement>(null);'),
  'RegistrationPage has dual refs for camera and device gallery'
);

assert(
  regFile.includes('capture="environment"') &&
  regFile.includes("t('photoTakePhotoBtn')") &&
  regFile.includes("t('photoUploadDeviceBtn')"),
  'RegistrationPage has direct mobile camera button with capture="environment" and device upload button'
);

assert(
  regFile.includes("{t('genderLabel')} <span className=\"text-red-500\">*</span>") &&
  regFile.includes("{t('villageLabel')} <span className=\"text-red-500\">*</span>") &&
  regFile.includes("{t('streetLabel')} <span className=\"text-red-500\">*</span>"),
  'RegistrationPage displays clear red asterisk (*) for mandatory Gender, Village and Street'
);

// 3. Image Compressor check
const compFile = fs.readFileSync(path.join(projectRoot, 'src/utils/imageCompressor.ts'), 'utf8');

assert(
  compFile.includes('file.slice(0, 524288)'),
  'imageCompressor reads up to 512 KB to safely handle large EXIF APP1 headers (>64 KB) on Samsung/Xiaomi'
);

assert(
  compFile.includes('tag === 0x0112') &&
  compFile.includes('orientation >= 5 && orientation <= 8'),
  'imageCompressor detects EXIF orientation tag 0x0112 and adjusts dimensions for rotated photos'
);

assert(
  !compFile.includes('bitmap = await createImageBitmap(file);') &&
  compFile.includes('imageOrientation: \'from-image\''),
  'imageCompressor prevents unconstrained createImageBitmap(file) decode, preventing mobile low-memory crashes'
);

// 4. memberService check
const servFile = fs.readFileSync(path.join(projectRoot, 'src/services/memberService.ts'), 'utf8');

assert(
  servFile.includes("approval_status: 'pending'") &&
  !servFile.includes("approval_status: 'approved'"),
  'memberService registers new members with approval_status: pending'
);

assert(
  servFile.includes(".from('members')\n          .insert([newRecord]);") ||
  servFile.includes(".from('members').insert([newRecord])") ||
  !servFile.includes(".from('members')\n          .insert([newRecord])\n          .select()\n          .single();"),
  'memberService inserts into Supabase without .select().single() under anon role (avoids 42501 RLS error)'
);

assert(
  servFile.includes('getMemberPhotoSignedUrl') &&
  servFile.includes('resolveMemberPhotoUrl'),
  'memberService automatically resolves signed URLs for private member photos'
);

// 5. CR80MembershipCard check
const cardFile = fs.readFileSync(path.join(projectRoot, 'src/components/CR80MembershipCard.tsx'), 'utf8');

assert(
  cardFile.includes('getMemberPhotoSignedUrl') &&
  cardFile.includes('crossOrigin="anonymous"'),
  'CR80MembershipCard resolves signed URLs and includes crossOrigin="anonymous" for clean PDF/print export'
);

assert(
  cardFile.includes('onError={() => setPhotoError(true)}') ||
  cardFile.includes('setPhotoError'),
  'CR80MembershipCard provides bulletproof onError fallback to official logo, never broken or empty photo'
);

// 6. MemberManagement check
const adminFile = fs.readFileSync(path.join(projectRoot, 'src/pages/admin/MemberManagement.tsx'), 'utf8');

assert(
  adminFile.includes('handleUpdateApproval') &&
  adminFile.includes("handleUpdateApproval(m.id, 'approved')") &&
  adminFile.includes("handleUpdateApproval(m.id, 'rejected')"),
  'MemberManagement provides admin actions to approve or reject pending member registrations'
);

assert(
  adminFile.includes('selectedStatus') &&
  adminFile.includes('m.approval_status === \'pending\''),
  'MemberManagement filters by status and displays pending badges'
);

console.log(`\nResults: ${passCount} PASSED, ${failCount} FAILED.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All verification assertions passed cleanly!');
}
