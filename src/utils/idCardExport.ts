import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Member } from '../types';

/**
 * Standard CR80 Dimensions:
 * Physical Size: 53.98 mm × 85.60 mm
 * Aspect Ratio: 53.98 / 85.60 = 0.630607
 * 300 DPI Pixel Size: 638 px × 1011 px
 */
export const CR80_WIDTH_MM = 53.98;
export const CR80_HEIGHT_MM = 85.60;
export const CR80_WIDTH_PX = 318;
export const CR80_HEIGHT_PX = 504;
export const CR80_DPI_300_WIDTH = 638;
export const CR80_DPI_300_HEIGHT = 1011;

/**
 * Ensures all web fonts and images in the target element are completely loaded
 * before capturing to canvas to prevent missing glyphs, broken images or clipped text.
 */
export async function prepareElementForCapture(element: HTMLElement): Promise<void> {
  // 1. Wait for document fonts to be ready
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('document.fonts.ready check failed, proceeding anyway:', e);
    }
  }

  // 2. Wait for all <img> elements inside to be fully loaded and painted
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
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
        // Resilient timeout for mobile networks (3.5s)
        setTimeout(onDone, 3500);
      });
    })
  );

  // 3. Render tick to ensure browser layout & font rasterization complete
  await new Promise((resolve) => setTimeout(resolve, 150));
}

/**
 * Captures a card DOM element as a high-resolution 300 DPI HTML5 Canvas.
 * Handles hidden/off-screen mobile elements gracefully by cloning to an offscreen viewport.
 */
export async function captureCardCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  let target = element;
  let cleanupClone: (() => void) | null = null;

  // Handle hidden elements (e.g. mobile tabs where one side has display: none or zero width)
  const isHidden = !element.offsetWidth || !element.offsetHeight || 
    (typeof window !== 'undefined' && window.getComputedStyle(element).display === 'none');

  if (isHidden && typeof document !== 'undefined') {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = `${CR80_WIDTH_PX}px`;
    clone.style.height = `${CR80_HEIGHT_PX}px`;
    clone.style.display = 'flex';
    clone.style.flexDirection = 'column';
    clone.style.visibility = 'visible';
    clone.style.zIndex = '-9999';
    document.body.appendChild(clone);
    target = clone;
    cleanupClone = () => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    };
  }

  try {
    await prepareElementForCapture(target);

    const targetWidth = target.offsetWidth || CR80_WIDTH_PX;
    // Exact 300 DPI scale: 638px width / 318px css = ~2.006x
    const scale = CR80_DPI_300_WIDTH / targetWidth;

    return await html2canvas(target, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      imageTimeout: 15000,
      width: CR80_WIDTH_PX,
      height: CR80_HEIGHT_PX
    });
  } finally {
    if (cleanupClone) {
      cleanupClone();
    }
  }
}

/**
 * Generates an exact 2-Page CR80 PDF (Page 1 = Front, Page 2 = Back)
 * or a single page PDF if only one side is requested.
 * Dimensions: 53.98 mm × 85.60 mm (Standard ISO/IEC 7810 ID-1)
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
    const frontCanvas = await captureCardCanvas(frontElement);
    const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(frontImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'FAST');
  } else if (mode === 'back') {
    if (!backElement) throw new Error('Back card element not found');
    const backCanvas = await captureCardCanvas(backElement);
    const backImgData = backCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(backImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'FAST');
  } else {
    // Mode is 'both': EXACTLY 2 PAGES (Page 1 = Front, Page 2 = Back)
    if (!frontElement) throw new Error('Front card element not found');
    const frontCanvas = await captureCardCanvas(frontElement);
    const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(frontImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'FAST');

    if (backElement) {
      const backCanvas = await captureCardCanvas(backElement);
      const backImgData = backCanvas.toDataURL('image/png', 1.0);
      pdf.addPage([CR80_WIDTH_MM, CR80_HEIGHT_MM], 'p');
      pdf.addImage(backImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'FAST');
    }
  }

  const cleanId = (member.membership_number || 'Member').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${cleanId}_CR80_ID_Card.pdf`;
  pdf.save(filename);
}

/**
 * Exports a high-resolution 300 DPI PNG of the specified card side.
 */
export async function exportCardPng(
  element: HTMLElement,
  member: Member,
  side: 'Front' | 'Back'
): Promise<void> {
  const canvas = await captureCardCanvas(element);
  const link = document.createElement('a');
  link.download = `${member.membership_number || 'Member'}_CR80_${side}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}
