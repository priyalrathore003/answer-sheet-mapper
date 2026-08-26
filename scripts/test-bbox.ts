/**
 * One-shot proof of concept: send a single answer-sheet page image to
 * Gemini, get back answer regions with bounding boxes, and render those
 * boxes over the original image so accuracy can be checked visually.
 *
 * Usage:
 *   npx tsx scripts/test-bbox.ts <path-to-image> [pageIndex]
 */
import sharp from "sharp";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.join(process.cwd(), ".env.local") });
import { extractAnswerBoxesForPage, type RawAnswerBox } from "../src/lib/answerExtraction";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function boxColor(i: number): string {
  const palette = [
    "#ef4444", "#3b82f6", "#22c55e", "#eab308",
    "#a855f7", "#ec4899", "#14b8a6", "#f97316",
  ];
  return palette[i % palette.length];
}

async function main() {
  const [, , imagePathArg, pageIndexArg] = process.argv;
  if (!imagePathArg) {
    console.error("Usage: npx tsx scripts/test-bbox.ts <path-to-image> [pageIndex]");
    process.exit(1);
  }

  const imagePath = path.resolve(imagePathArg);
  const pageIndex = pageIndexArg ? parseInt(pageIndexArg, 10) : 1;
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) {
    console.error(`Unsupported image extension "${ext}". Use png/jpg/jpeg/webp.`);
    process.exit(1);
  }

  const imageBytes = await readFile(imagePath);
  const meta = await sharp(imageBytes).metadata();
  const width = meta.width!;
  const height = meta.height!;
  console.log(`Loaded ${imagePath} (${width}x${height})`);

  const boxes: RawAnswerBox[] = await extractAnswerBoxesForPage(imageBytes, mimeType, pageIndex);
  console.log(`\nGemini returned ${boxes.length} answer region(s):\n`);
  boxes.forEach((b, i) => {
    console.log(
      `${i + 1}. [${b.question_label || "(no label)"}] box_2d=${JSON.stringify(b.box_2d)}\n   "${b.answer_text.slice(0, 100)}${b.answer_text.length > 100 ? "..." : ""}"`
    );
  });

  // Render boxes as an SVG overlay, scaling normalized [ymin,xmin,ymax,xmax]
  // (0-1000) to this image's actual pixel dimensions, per axis.
  const rects = boxes
    .map((b, i) => {
      const [yMin, xMin, yMax, xMax] = b.box_2d;
      const x = (xMin / 1000) * width;
      const y = (yMin / 1000) * height;
      const w = ((xMax - xMin) / 1000) * width;
      const h = ((yMax - yMin) / 1000) * height;
      const color = boxColor(i);
      const label = (b.question_label || `#${i + 1}`).replace(/[<>&]/g, "");
      const fontSize = Math.max(12, Math.round(height * 0.01));
      // Label chip sits INSIDE the box's top-left corner (not above it) so it
      // never visually bleeds into a neighboring row when rows are packed tight.
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}"
              fill="none" stroke="${color}" stroke-width="2.5" />
        <rect x="${x}" y="${y}" width="${fontSize * (label.length * 0.6 + 1)}" height="${fontSize + 4}"
              fill="${color}" opacity="0.85" />
        <text x="${x + 3}" y="${y + fontSize}"
              font-family="sans-serif" font-size="${fontSize}" fill="white" font-weight="bold">${label}</text>
      `;
    })
    .join("\n");

  const svgOverlay = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;

  const outDir = path.join(process.cwd(), "out");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `bbox-${path.basename(imagePath, ext)}.png`);

  await sharp(imageBytes)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toFile(outPath);

  // Also dump the raw parsed JSON next to it for inspection.
  const jsonPath = path.join(outDir, `bbox-${path.basename(imagePath, ext)}.json`);
  await writeFile(jsonPath, JSON.stringify(boxes, null, 2), "utf-8");

  console.log(`\nWrote annotated image -> ${outPath}`);
  console.log(`Wrote raw boxes JSON  -> ${jsonPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
