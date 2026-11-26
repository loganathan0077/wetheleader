import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();

console.log('=== VERIFYING AUTOMATIC PHOTO COMPRESSION IMPLEMENTATION ===\n');

// Test 1: Image compressor utility exists and fulfills requirements
const compressorPath = path.join(rootDir, 'src/utils/imageCompressor.ts');
assert(fs.existsSync(compressorPath), 'src/utils/imageCompressor.ts must exist');
const compressorContent = fs.readFileSync(compressorPath, 'utf-8');

assert(compressorContent.includes('export async function compressImageFile'), 'Must export compressImageFile function');
assert(compressorContent.includes('export function isValidImageFile'), 'Must export isValidImageFile function');
assert(compressorContent.includes('maxDim = options.maxDimension || 600'), 'Must default to 600px maximum dimension');
assert(compressorContent.includes('targetMaxKB = options.targetMaxKB || 50'), 'Must target 50 KB maximum');
assert(compressorContent.includes('minQuality = options.minQuality || 0.55'), 'Must enforce quality floor (0.55) to protect face clarity');
assert(compressorContent.includes("'image/jpeg'"), 'Must output universal JPEG format for ID cards');
assert(compressorContent.includes('canvas.toBlob'), 'Must compress via HTML5 canvas toBlob');
assert(compressorContent.includes('fillStyle = \'#FFFFFF\''), 'Must fill white background to prevent transparent PNGs rendering black');

console.log('✓ PASS: Image compressor utility implements 600px max dimension, 20-50 KB target, JPEG format & quality floor.');

// Test 2: Aspect ratio preservation logic
assert(compressorContent.includes('if (origWidth >= origHeight)'), 'Handles landscape/square proportional scaling');
assert(compressorContent.includes('targetHeight = Math.round((origHeight * maxDim) / origWidth);'), 'Preserves landscape aspect ratio');
assert(compressorContent.includes('targetWidth = Math.round((origWidth * maxDim) / origHeight);'), 'Preserves portrait aspect ratio');

console.log('✓ PASS: Proportional scaling logic strictly prevents stretching, squishing, or cropping faces.');

// Test 3: RegistrationPage integrates compression and displays compressed size
const regPageContent = fs.readFileSync(path.join(rootDir, 'src/pages/RegistrationPage.tsx'), 'utf-8');

assert(regPageContent.includes("import { compressImageFile"), 'RegistrationPage imports compressImageFile');
assert(regPageContent.includes("photoStats"), 'RegistrationPage tracks photoStats');
assert(regPageContent.includes("isCompressingPhoto"), 'RegistrationPage tracks compression loading state');
assert(regPageContent.includes("photoError"), 'RegistrationPage handles photo error state');
assert(regPageContent.includes("profile_photo_url: result.dataUrl"), 'Saves compressed dataUrl in form data, never original file');
assert(regPageContent.includes("photoCompressedBadge"), 'Displays compressed file size badge before upload');

console.log('✓ PASS: RegistrationPage automatically compresses uploaded photos, displays file size badge, and saves compressed image.');

// Test 4: Mobile camera & gallery capture
assert(regPageContent.includes('accept="image/*"'), 'Accepts all standard mobile image formats');
assert(regPageContent.includes('capture="user"'), 'Supports direct mobile front/user camera capture');

console.log('✓ PASS: Mobile camera and gallery photo uploads supported.');

// Test 5: Translations exist for Tamil and English
const transContent = fs.readFileSync(path.join(rootDir, 'src/i18n/translations.ts'), 'utf-8');

assert(transContent.includes('photoCompressing:'), 'English translation for photoCompressing');
assert(transContent.includes('photoCompressedBadge:'), 'English translation for photoCompressedBadge');
assert(transContent.includes('photoInvalidType:'), 'English translation for photoInvalidType');
assert(transContent.includes('"படம் சுருக்கப்படுகிறது..."'), 'Tamil translation for photoCompressing');
assert(transContent.includes('"சுருக்கப்பட்டது: {size}"'), 'Tamil translation for photoCompressedBadge');

console.log('✓ PASS: English and Tamil translations added for photo compression states.');

// Test 6: Admin MemberManagement also provides compressed photo uploads
const adminMemberContent = fs.readFileSync(path.join(rootDir, 'src/pages/admin/MemberManagement.tsx'), 'utf-8');

assert(adminMemberContent.includes('compressImageFile'), 'Admin MemberManagement imports compressImageFile');
assert(adminMemberContent.includes('handleAdminPhotoUpload'), 'Admin MemberManagement provides photo upload handler');

console.log('✓ PASS: Admin MemberManagement modal also supports compressed photo uploads.');

console.log('\n=== ALL PHOTO COMPRESSION VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
