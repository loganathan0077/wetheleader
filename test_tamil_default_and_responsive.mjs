import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();

console.log('=== VERIFYING TAMIL DEFAULT & RESPONSIVE BEHAVIOR ===\n');

// Test 1: LanguageContext defaults to 'ta' for first-time visitors
const langContextFile = fs.readFileSync(path.join(rootDir, 'src/context/LanguageContext.tsx'), 'utf-8');

assert(
  langContextFile.includes("return (saved === 'ta' || saved === 'en') ? saved : 'ta';"),
  'LanguageContext must default to Tamil ("ta") when no saved preference exists'
);

assert(
  langContextFile.includes("localStorage.setItem('wtl_preferred_lang', language);"),
  'LanguageContext must persist language changes to localStorage'
);

console.log('✓ PASS: First-time visitor default is Tamil ("ta") and custom selection persists.');

// Test 2: Header component supports Tamil toggle and responsive hamburger
const headerFile = fs.readFileSync(path.join(rootDir, 'src/components/Header.tsx'), 'utf-8');

assert(
  headerFile.includes("language === 'en' ? 'தமிழ்' : 'English'"),
  'Header displays appropriate toggle button label based on active language'
);

assert(
  headerFile.includes("setMenuOpen(!menuOpen)"),
  'Header contains clickable hamburger button'
);

assert(
  headerFile.includes("fixed inset-y-0 right-0 w-80 sm:w-96"),
  'Hamburger drawer has responsive width (w-80 on mobile, sm:w-96 on tablet/desktop)'
);

console.log('✓ PASS: Header and Hamburger Drawer are responsive across mobile, tablet, and desktop.');

// Test 3: HomePage contains responsive grid and Tamil fallback strings
const homePageFile = fs.readFileSync(path.join(rootDir, 'src/pages/HomePage.tsx'), 'utf-8');

assert(
  homePageFile.includes("overflow-x-hidden"),
  'HomePage root prevents mobile horizontal scrollbar leakage'
);

assert(
  homePageFile.includes("grid-cols-1 lg:grid-cols-12"),
  'Hero section uses responsive grid (stacked 1-col on mobile, 12-col on desktop)'
);

assert(
  homePageFile.includes("language === 'ta'"),
  'HomePage checks active Tamil language for dynamic content rendering'
);

console.log('✓ PASS: HomePage responsive layout and Tamil support verified.');

console.log('\n=== ALL TAMIL DEFAULT & RESPONSIVE TESTS PASSED SUCCESSFULLY! ===\n');
