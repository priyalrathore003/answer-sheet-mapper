import sharp from "sharp";
import { renderPdfToPngPages } from "./pdf";

/**
 * Turn one uploaded file into one or more page images (PNG). A PDF expands
 * into one image per page; a plain image file is already a single page.
 */
async function fileToPngPages(file: File): Promise<Buffer[]> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    return renderPdfToPngPages(bytes);
  }
  const png = await sharp(bytes).png().toBuffer();
  return [png];
}

/**
 * A teacher can upload either one multi-page PDF or several image files (one
 * per page) for the same document. Flatten whatever combination they picked
 * into a single ordered list of page images.
 */
export async function filesToPngPages(files: File[]): Promise<Buffer[]> {
  const pages: Buffer[] = [];
  for (const file of files) {
    pages.push(...(await fileToPngPages(file)));
  }
  return pages;
}

export function pngToDataUrl(png: Buffer): string {
  return `data:image/png;base64,${png.toString("base64")}`;
}
