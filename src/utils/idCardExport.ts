import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { Member } from '../types';

/**
 * Standard ISO/IEC 7810 ID-1 (CR80) Dimensions:
 * Physical Size: 53.98 mm × 85.60 mm
 * Aspect Ratio: 53.98 / 85.60 = 0.630607
 * On-Screen Display: 318 px × 504 px (318 / 504 = 0.63095)
 * 480 DPI High-Resolution Export: 1016 px × 1612 px (1016 / 1612 = 0.63027)
 */
export const CR80_WIDTH_MM = 53.98;
export const CR80_HEIGHT_MM = 85.60;
export const CR80_WIDTH_PX = 318;
export const CR80_HEIGHT_PX = 504;
export const CR80_EXPORT_WIDTH_PX = 1016;
export const CR80_EXPORT_HEIGHT_PX = 1612;

/**
 * Ensures all web fonts, images, QR codes and logos in the target element
 * are completely loaded and painted before capturing to canvas.
 */
export async function prepareElementForCapture(element: HTMLElement): Promise<void> {
  // 1. Wait for document fonts (including Tamil fonts) to be ready
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('document.fonts.ready check failed, proceeding anyway:', e);
    }
  }

  // 2. Wait for all <img> elements (photo, logo, QR code) to be fully loaded and pre-fetch remote images
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src');
      if (src && (src.startsWith('http://') || src.startsWith('https://')) && !src.startsWith('data:')) {
        try {
          const res = await fetch(src, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            img.src = dataUrl;
          }
        } catch (e) {
          // If fetch fails, proceed with original src
        }
      }

      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        let finished = false;
        const onDone = () => {
          if (!finished) {
            finished = true;
            img.removeEventListener('load', onDone);
            img.removeEventListener('error', onDone);
            resolve();
          }
        };
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
        // Resilient timeout for mobile/slower networks
        setTimeout(onDone, 3500);
      });
    })
  );

  // 3. Render tick to ensure browser layout & rasterization complete
  await new Promise((resolve) => setTimeout(resolve, 200));
}

/**
 * Captures a card DOM element as an exact 480 DPI HTML5 Canvas (1016 px × 1612 px).
 * Directly captures the live, rendered card DOM element from the screen (visual source of truth).
 * Does NOT clone to off-screen elements with missing styles or unconstrained layout.
 */
export async function captureCardCanvas(
  element: HTMLElement,
  targetWidth: number = CR80_EXPORT_WIDTH_PX,
  targetHeight: number = CR80_EXPORT_HEIGHT_PX
): Promise<HTMLCanvasElement> {
  if (!element) {
    throw new Error('Target card element is missing');
  }

  // Handle case where element or an ancestor has display: none (e.g. inactive mobile tab)
  const modifiedElements: { el: HTMLElement; prevDisplay: string }[] = [];
  let curr: HTMLElement | null = element;
  while (curr && curr !== document.body) {
    const computedDisplay = window.getComputedStyle(curr).display;
    if (computedDisplay === 'none') {
      modifiedElements.push({ el: curr, prevDisplay: curr.style.display });
      curr.style.display = 'flex';
    }
    curr = curr.parentElement;
  }

  try {
    await prepareElementForCapture(element);

    // Exact scale factor to reach targetWidth from on-screen 318px CSS width (1016 / 318 = 3.194968x)
    const scale = targetWidth / CR80_WIDTH_PX;

    const rawCanvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      imageTimeout: 15000
    });

    // Normalize to exact targetWidth × targetHeight (1016 × 1612) with high quality smoothing
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;
    const ctx = outputCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(rawCanvas, 0, 0, targetWidth, targetHeight);
    }
    return outputCanvas;
  } finally {
    for (const item of modifiedElements) {
      item.el.style.display = item.prevDisplay;
    }
  }
}

/**
 * Generates an exact 2-Page CR80 PDF (Page 1 = Front, Page 2 = Back).
 * Dimensions: 53.98 mm × 85.60 mm (Standard ISO/IEC 7810 ID-1).
 * Uses 480 DPI source renders for crystal-clear vector-like sharpness.
 */
export async function exportCardPdf(
  frontElement: HTMLElement | null,
  backElement: HTMLElement | null,
  member: Member,
  mode: 'both' | 'front' | 'back' = 'both'
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [CR80_WIDTH_MM, CR80_HEIGHT_MM],
    compress: true
  });

  if (mode === 'front') {
    if (!frontElement) throw new Error('Front card element not found');
    const frontCanvas = await captureCardCanvas(frontElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
    const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(frontImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'SLOW');
  } else if (mode === 'back') {
    if (!backElement) throw new Error('Back card element not found');
    const backCanvas = await captureCardCanvas(backElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
    const backImgData = backCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(backImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'SLOW');
  } else {
    // Mode is 'both': EXACTLY 2 PAGES (Page 1 = Front, Page 2 = Back)
    if (!frontElement) throw new Error('Front card element not found');
    const frontCanvas = await captureCardCanvas(frontElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
    const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(frontImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'SLOW');

    if (backElement) {
      const backCanvas = await captureCardCanvas(backElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
      const backImgData = backCanvas.toDataURL('image/png', 1.0);
      pdf.addPage([CR80_WIDTH_MM, CR80_HEIGHT_MM], 'p');
      pdf.addImage(backImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'SLOW');
    }
  }

  const cleanId = (member.membership_number || 'Member').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${cleanId}_CR80_ID_Card.pdf`;
  pdf.save(filename);
}

/**
 * Exports a high-resolution 480 DPI PNG (1016 × 1612 px) of the specified card side.
 * Output name format: WTL-2026-00002_FRONT.png or WTL-2026-00002_BACK.png
 */
export async function exportCardPng(
  element: HTMLElement,
  member: Member,
  side: 'FRONT' | 'BACK' | 'Front' | 'Back'
): Promise<void> {
  const canvas = await captureCardCanvas(element, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
  const cleanId = (member.membership_number || 'Member').replace(/[^a-zA-Z0-9-_]/g, '_');
  const normalizedSide = side.toUpperCase();
  const filename = `${cleanId}_${normalizedSide}.png`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * Exports both Front and Back high-resolution PNGs (1016 × 1612 px each) inside a single ZIP file.
 */
export async function exportBothCardsZip(
  frontElement: HTMLElement,
  backElement: HTMLElement,
  member: Member
): Promise<void> {
  const zip = new JSZip();

  const frontCanvas = await captureCardCanvas(frontElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
  const backCanvas = await captureCardCanvas(backElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);

  const frontData = frontCanvas.toDataURL('image/png', 1.0).split(',')[1];
  const backData = backCanvas.toDataURL('image/png', 1.0).split(',')[1];

  const cleanId = (member.membership_number || 'Member').replace(/[^a-zA-Z0-9-_]/g, '_');
  zip.file(`${cleanId}_FRONT.png`, frontData, { base64: true });
  zip.file(`${cleanId}_BACK.png`, backData, { base64: true });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.download = `${cleanId}_CR80_PNG_Cards.zip`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export interface PrintCardOptions {
  mode?: 'both' | 'front' | 'back';
  paperFormat?: 'cr80' | 'a4';
}

/**
 * Dedicated isolated print execution.
 * Renders high-resolution card images into an isolated hidden document,
 * guaranteeing:
 * - Exactly 2 pages for duplex (or 1 page for single side).
 * - Zero clipping or enlarged front card.
 * - Zero interference from dashboard layout, modals, or sidebars.
 * - Proper duplex alignment (flip on short edge).
 */
export async function printCardIsolated(
  frontElement: HTMLElement | null,
  backElement: HTMLElement | null,
  member: Member,
  options: PrintCardOptions = {}
): Promise<void> {
  const { mode = 'both', paperFormat = 'cr80' } = options;
  const cleanId = (member.membership_number || 'Member').replace(/[^a-zA-Z0-9-_]/g, '_');

  const includeFront = (mode === 'both' || mode === 'front') && Boolean(frontElement);
  const includeBack = (mode === 'both' || mode === 'back') && Boolean(backElement);

  if (!includeFront && !includeBack) {
    throw new Error('No valid card elements found for print');
  }

  // Pre-render crisp 480 DPI canvases
  let frontImgData = '';
  if (includeFront && frontElement) {
    const frontCanvas = await captureCardCanvas(frontElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
    frontImgData = frontCanvas.toDataURL('image/png', 1.0);
  }

  let backImgData = '';
  if (includeBack && backElement) {
    const backCanvas = await captureCardCanvas(backElement, CR80_EXPORT_WIDTH_PX, CR80_EXPORT_HEIGHT_PX);
    backImgData = backCanvas.toDataURL('image/png', 1.0);
  }

  let htmlContent = '';

  if (paperFormat === 'cr80') {
    // Mode A: Direct Standard CR80 Card (53.98 mm × 85.60 mm) - for PVC card printers
    htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanId}_CR80_Card_Print</title>
  <style>
    @page {
      size: 53.98mm 85.60mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 53.98mm;
      height: 85.60mm;
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .cr80-page {
      width: 53.98mm;
      height: 85.60mm;
      max-width: 53.98mm;
      max-height: 85.60mm;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cr80-page img {
      width: 53.98mm;
      height: 85.60mm;
      display: block;
      object-fit: fill;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
  </style>
</head>
<body>
  ${includeFront ? `<div class="cr80-page ${includeBack ? 'page-break' : ''}"><img src="${frontImgData}" alt="Front Card" /></div>` : ''}
  ${includeBack ? `<div class="cr80-page"><img src="${backImgData}" alt="Back Card" /></div>` : ''}
</body>
</html>`;
  } else {
    // Mode B: Standard A4 / Letter Paper Sheet (100% Actual Size with Duplex Alignment Marks)
    htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanId}_A4_Duplex_Sheet_Print</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .a4-sheet {
      width: 210mm;
      height: 297mm;
      max-width: 210mm;
      max-height: 297mm;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      position: relative;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .card-frame {
      width: 53.98mm;
      height: 85.60mm;
      position: relative;
      box-sizing: border-box;
    }
    .card-frame img {
      width: 53.98mm;
      height: 85.60mm;
      display: block;
      border-radius: 3.18mm;
      box-shadow: 0 0 0 0.15mm #94a3b8;
    }
    .crop-mark-tl { position: absolute; top: -4mm; left: -4mm; width: 3.5mm; height: 3.5mm; border-right: 0.2mm dashed #94a3b8; border-bottom: 0.2mm dashed #94a3b8; }
    .crop-mark-tr { position: absolute; top: -4mm; right: -4mm; width: 3.5mm; height: 3.5mm; border-left: 0.2mm dashed #94a3b8; border-bottom: 0.2mm dashed #94a3b8; }
    .crop-mark-bl { position: absolute; bottom: -4mm; left: -4mm; width: 3.5mm; height: 3.5mm; border-right: 0.2mm dashed #94a3b8; border-top: 0.2mm dashed #94a3b8; }
    .crop-mark-br { position: absolute; bottom: -4mm; right: -4mm; width: 3.5mm; height: 3.5mm; border-left: 0.2mm dashed #94a3b8; border-top: 0.2mm dashed #94a3b8; }
    
    .sheet-guide {
      position: absolute;
      bottom: 22mm;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8pt;
      color: #64748b;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  ${includeFront ? `
  <div class="a4-sheet ${includeBack ? 'page-break' : ''}">
    <div class="card-frame">
      <div class="crop-mark-tl"></div>
      <div class="crop-mark-tr"></div>
      <div class="crop-mark-bl"></div>
      <div class="crop-mark-br"></div>
      <img src="${frontImgData}" alt="Front Card" />
    </div>
    <div class="sheet-guide">
      <strong>WE THE LEADER &bull; OFFICIAL CR80 ID CARD (53.98 mm &times; 85.60 mm)</strong><br/>
      PAGE 1: FRONT SIDE &bull; PRINT AT 100% SCALE (DO NOT SCALE / FIT TO PAGE)<br/>
      DUPLEX INSTRUCTION: Print on both sides &bull; <strong>Flip on short edge</strong>
    </div>
  </div>` : ''}

  ${includeBack ? `
  <div class="a4-sheet">
    <div class="card-frame">
      <div class="crop-mark-tl"></div>
      <div class="crop-mark-tr"></div>
      <div class="crop-mark-bl"></div>
      <div class="crop-mark-br"></div>
      <img src="${backImgData}" alt="Back Card" />
    </div>
    <div class="sheet-guide">
      <strong>WE THE LEADER &bull; OFFICIAL CR80 ID CARD (53.98 mm &times; 85.60 mm)</strong><br/>
      PAGE 2: BACK SIDE (VERIFICATION QR)<br/>
      Trim along the corner crop marks for standard physical CR80 dimensions.
    </div>
  </div>` : ''}
</body>
</html>`;
  }

  // Print via isolated iframe
  return new Promise((resolve) => {
    const existing = document.getElementById('wtl-print-isolated-iframe');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'wtl-print-isolated-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      resolve();
      return;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('Error invoking print:', err);
        }
        resolve();
      }, 400);
    };
  });
}
