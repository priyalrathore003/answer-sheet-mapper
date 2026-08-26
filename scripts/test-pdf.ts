import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderPdfToPngPages } from "../src/lib/pdf";

async function main() {
  const [, , pdfPathArg] = process.argv;
  if (!pdfPathArg) {
    console.error("Usage: npx tsx scripts/test-pdf.ts <path-to-pdf>");
    process.exit(1);
  }
  const pdfBytes = await readFile(path.resolve(pdfPathArg));
  const pages = await renderPdfToPngPages(pdfBytes);
  const outDir = path.join(process.cwd(), "out");
  await mkdir(outDir, { recursive: true });
  for (let i = 0; i < pages.length; i++) {
    const outPath = path.join(outDir, `pdf-page-${i + 1}.png`);
    await writeFile(outPath, pages[i]);
    console.log(`page ${i + 1} -> ${outPath} (${pages[i].length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
