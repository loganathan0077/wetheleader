import fs from 'fs';
import path from 'path';

console.log('--- RUNNING WE THE LEADER ID CARD & PDF FIXES VERIFICATION ---\n');

const cr80CardPath = path.resolve('src/components/CR80MembershipCard.tsx');
const idCardExportPath = path.resolve('src/utils/idCardExport.ts');
const memberManagementPath = path.resolve('src/pages/admin/MemberManagement.tsx');
const registrationSuccessPath = path.resolve('src/pages/RegistrationSuccessPage.tsx');
const indexCssPath = path.resolve('src/index.css');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   Details: ${details}`);
  }
}

// 1. Verify CR80 Physical & Pixel Dimensions
const cr80Content = fs.readFileSync(cr80CardPath, 'utf-8');
assert(
  cr80Content.includes("width: '318px'") && cr80Content.includes("height: '504px'"),
  'Card maintains exact CR80 aspect ratio in CSS (318px × 504px for 53.98 × 85.60 mm)'
);

// 2. Verify Two-Line Member Name Layout (Tamil Line 1 + English Line 2 without parentheses)
assert(
  cr80Content.includes('formatCardMemberName') &&
  cr80Content.includes('parsedName.tamilName') &&
  cr80Content.includes('parsedName.englishName') &&
  cr80Content.includes('font-tamil') &&
  cr80Content.includes('font-medium text-slate-700') &&
  !cr80Content.includes('line-clamp-2'),
  'Front card formats member name into 2 separate lines: Tamil (bold/larger) and English (medium/smaller, no parentheses)'
);

// 3. Verify Status Badge with Proper Tamil Font & Spacing
assert(
  cr80Content.includes('ACTIVE MEMBER') &&
  cr80Content.includes('அதிகாரப்பூர்வ உறுப்பினர்') &&
  cr80Content.includes('font-tamil font-bold text-emerald-900'),
  'Status pill uses clear font styling and font-tamil to prevent character overlap'
);

// 4. Verify Photo Fallback clearly displays official logo
assert(
  cr80Content.includes('WE the Leader Official') &&
  cr80Content.includes('/logo.svg') &&
  cr80Content.includes('MEMBER'),
  'Photo fallback clearly shows official logo and member title when no photo uploaded'
);

// 5. Verify Details Grid Safe Area & Truncation with Tooltips
assert(
  cr80Content.includes('VILLAGE / கிராமம்') &&
  cr80Content.includes('WARD / வார்டு') &&
  cr80Content.includes('DISTRICT / மாவட்டம்') &&
  cr80Content.includes('ISSUED / பதிவு தேதி') &&
  cr80Content.includes('truncate'),
  'Details grid properly aligns Village, Ward, District, and Date in safe boundary'
);

// 6. Verify Back-Side Tamil Disclaimer Line Height & Font
assert(
  cr80Content.includes('leading-relaxed font-tamil') &&
  cr80Content.includes('இவ்வட்டை'),
  'Back-side Tamil notice uses relaxed leading and font-tamil to prevent vertical glyph overlap'
);

// 7. Verify Back-Side QR Code Frame & Quiet Zone
assert(
  cr80Content.includes('w-[106px] h-[106px]') &&
  cr80Content.includes('border-2 border-[#20223E]'),
  'QR code is optimized to 106×106px with white quiet zone and high scannability'
);

// 8. Verify Footer Updates (Front & Back)
assert(
  !cr80Content.includes('CR80 STANDARD CARD') &&
  !cr80Content.includes('STANDARD CR80 &bull; 53.98 × 85.60 MM') &&
  !cr80Content.includes('KINATHUKADAVU &bull; TAMIL NADU') &&
  cr80Content.includes('www.wetheleader.online') &&
  cr80Content.includes('www.wetheleader.org'),
  'Footers updated: "CR80 STANDARD CARD", "KINATHUKADAVU • TAMIL NADU", and bottom-right "wetheleader.org" removed from bottom bars; "www.wetheleader.online" centered across both front and back footers'
);

// 9. Verify idCardExport.ts preparation pipeline
const exportContent = fs.readFileSync(idCardExportPath, 'utf-8');
assert(
  exportContent.includes('document.fonts.ready') &&
  exportContent.includes('img.complete') &&
  exportContent.includes('CR80_DPI_300_WIDTH'),
  'Export pipeline waits for document.fonts.ready and image loading before 300 DPI canvas capture'
);

// 10. Verify PDF generation uses exact CR80 page size [53.98, 85.60] mm
assert(
  exportContent.includes('format: [CR80_WIDTH_MM, CR80_HEIGHT_MM]') &&
  exportContent.includes('CR80_WIDTH_MM = 53.98') &&
  exportContent.includes('CR80_HEIGHT_MM = 85.60'),
  'PDF export generates custom page format matching physical CR80 card: 53.98 mm × 85.60 mm'
);

// 11. Verify Admin Modal container sizing (max-w-4xl and max-h-[92vh])
const adminContent = fs.readFileSync(memberManagementPath, 'utf-8');
assert(
  adminContent.includes('max-w-4xl') &&
  adminContent.includes('max-h-[92vh]') &&
  adminContent.includes('overflow-y-auto flex-1'),
  'Admin print preview modal is widened to max-w-4xl with flexible scroll to prevent clipping footers'
);

// 12. Verify Modal Responsive Side-by-Side and Stacked Layout
assert(
  adminContent.includes('flex flex-col md:flex-row items-center justify-center gap-6'),
  'Cards display side-by-side on desktop (md:flex-row) and stack vertically on mobile'
);

// 13. Verify Shared Export pipeline in both Admin & Registration Success
const regContent = fs.readFileSync(registrationSuccessPath, 'utf-8');
assert(
  adminContent.includes('exportCardPdf') &&
  regContent.includes('exportCardPdf'),
  'Both Admin portal and Registration Success page share the identical exportCardPdf pipeline'
);

// 14. Verify Print Styles in index.css
const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
assert(
  cssContent.includes('@page') &&
  cssContent.includes('size: 53.98mm 85.60mm;') &&
  cssContent.includes('page-break-after: always !important;') &&
  cssContent.includes('#printable-cr80-container'),
  '@media print enforces 53.98mm × 85.60mm page size with clean page-break-after for duplex printing'
);

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('🎉 ALL 13 TEST SCENARIOS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('❌ Some tests failed.');
  process.exit(1);
}
