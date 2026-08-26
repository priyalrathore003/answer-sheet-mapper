import type * as MuPdf from "mupdf";

/**
 * Rasterize every page of a PDF into a PNG buffer. Used for both the
 * question paper and the answer sheet: Gemini needs images, not PDFs, and
 * the browser needs images to render the answer sheet with highlight
 * overlays on top.
 *
 * mupdf.js is a WASM build with no native (node-gyp/Cairo) dependency, which
 * is what makes it safe to run inside a Vercel serverless function. It's
 * imported dynamically because its own module uses top-level await, which
 * breaks static ESM->CJS transforms (e.g. tsx running a plain script).
 */
export async function renderPdfToPngPages(pdfBytes: Buffer, targetWidth = 1700): Promise<Buffer[]> {
  const mupdf: typeof MuPdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
  const pages: Buffer[] = [];
  const pageCount = doc.countPages();

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const bounds = page.getBounds();
    const pageWidth = bounds[2] - bounds[0];
    const scale = targetWidth / pageWidth;

    const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false);
    const png = pixmap.asPNG();
    pages.push(Buffer.from(png));
  }

  return pages;
}
