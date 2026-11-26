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
 * before capturing to canvas to prevent missing glyphs or clipped text.
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

  // 2. Wait for all <img> elements inside to be fully loaded
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const onDone = () => {
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
          resolve();
        };
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
        // Fallback timeout in case image never fires
        setTimeout(resolve, 1000);
      });
    })
  );

  // 3. Small render tick to ensure DOM paints properly
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Captures a card DOM element as a high-resolution 300 DPI HTML5 Canvas.
 */
export async function captureCardCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  await prepareElementForCapture(element);

  const elementWidth = element.offsetWidth || CR80_WIDTH_PX;
  // Exact 300 DPI scale: 638px width
  const scale = CR80_DPI_300_WIDTH / elementWidth;

  return await html2canvas(element, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    imageTimeout: 15000,
    windowWidth: 1200
  });
}

/**
 * Generates an exact 2-Page CR80 PDF (Page 1 = Front, Page 2 = Back)
 * or a single page PDF if only one side is requested.
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

  if (mode === 'front' || mode === 'both') {
    if (!frontElement) throw new Error('Front card element not found');
    const frontCanvas = await captureCardCanvas(frontElement);
    const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(frontImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'SLOW');
  }

  if (mode === 'back') {
    if (!backElement) throw new Error('Back card element not found');
    const backCanvas = await captureCardCanvas(backElement);
    const backImgData = backCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(backImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'SLOW');
  } else if (mode === 'both' && backElement) {
    const backCanvas = await captureCardCanvas(backElement);
    const backImgData = backCanvas.toDataURL('image/png', 1.0);
    pdf.addPage([CR80_WIDTH_MM, CR80_HEIGHT_MM], 'p');
    pdf.addImage(backImgData, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'SLOW');
  }

  const filename = `${member.membership_number || 'Member'}_CR80_ID_Card.pdf`;
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
