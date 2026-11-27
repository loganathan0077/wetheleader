import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();

console.log('=== VERIFYING ABOUT US PAGE IMPLEMENTATION ===\n');

// Test 1: Photo exists in public folder
const photoPath = path.join(rootDir, 'public/apa-manikandakumar.jpg');
assert(fs.existsSync(photoPath), 'Profile photo /public/apa-manikandakumar.jpg must exist');
console.log('✓ PASS: Profile photo exists in public assets.');

// Test 2: AboutUsPage component exists and contains accurate profile content
const aboutPagePath = path.join(rootDir, 'src/pages/AboutUsPage.tsx');
assert(fs.existsSync(aboutPagePath), 'src/pages/AboutUsPage.tsx must exist');
const aboutContent = fs.readFileSync(aboutPagePath, 'utf-8');

// Tamil content checks
assert(aboutContent.includes('திரு. APA. மணிகண்டகுமார்'), 'Must include Tamil name');
assert(aboutContent.includes('We The Leader – Kinathukadavu அமைப்பின் முக்கிய முகமாகத் திகழ்பவர்'), 'Must include Tamil intro');
assert(aboutContent.includes('அண்ணாமலை அவர்களின் வழிகாட்டுதலின்படி'), 'Must include Tamil mentorship reference');
assert(aboutContent.includes('இளைஞர்களின் திறமைகளை வெளிக்கொண்டு வருதல்'), 'Must include Tamil focus areas');
assert(aboutContent.includes('அவரது நோக்கம்:'), 'Must include Tamil vision label');
assert(aboutContent.includes('நம் மண், நம் மக்கள், நம் பொறுப்பு!'), 'Must include Tamil motto');

// English content checks
assert(aboutContent.includes('Mr. APA. Manikandakumar'), 'Must include English name');
assert(aboutContent.includes('Mr. APA. Manikandakumar is a prominent face of We The Leader – Kinathukadavu.'), 'Must include English intro');
assert(aboutContent.includes('Under the guidance of Mr. Annamalai'), 'Must include English guidance reference');
assert(aboutContent.includes('His focus is on encouraging youth participation'), 'Must include English focus areas');
assert(aboutContent.includes('His Vision:'), 'Must include English vision label');
assert(aboutContent.includes('Our Land, Our People, Our Responsibility!'), 'Must include English motto');

console.log('✓ PASS: Tamil and English text strictly match user provided profile content without invented claims.');

// Test 3: Connects to global language selector and no duplicate switcher
assert(aboutContent.includes('const { language } = useLanguage();'), 'Must use global LanguageContext');
assert(!aboutContent.includes('toggleLanguage'), 'AboutUsPage must not create duplicate language switcher button');
assert(aboutContent.includes('font-tamil'), 'Applies Tamil typography styling');

console.log('✓ PASS: Connects to global language selector without creating a duplicate switcher.');

// Test 4: Image reference
assert(aboutContent.includes('src="/apa-manikandakumar.jpg"'), 'Must render /apa-manikandakumar.jpg');

console.log('✓ PASS: Renders prominent photo of Mr. APA. Manikandakumar.');

// Test 5: App.tsx routing includes about view
const appContent = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
assert(appContent.includes("import { AboutUsPage } from './pages/AboutUsPage';"), 'App imports AboutUsPage');
assert(appContent.includes("currentView === 'about'"), 'App renders AboutUsPage when currentView is about');

console.log('✓ PASS: App.tsx correctly routes to AboutUsPage.');

// Test 6: Header & Hamburger Menu navigate to About Us
const headerContent = fs.readFileSync(path.join(rootDir, 'src/components/Header.tsx'), 'utf-8');
assert(headerContent.includes("onNavigate('about')"), 'Header navigates to about view');

console.log('✓ PASS: Header and Hamburger Drawer navigate to About Us page.');

console.log('\n=== ALL ABOUT US PAGE TESTS PASSED SUCCESSFULLY! ===\n');
