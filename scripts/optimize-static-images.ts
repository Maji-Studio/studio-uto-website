/**
 * Optimizes the decorative images the components ship with, once, at authoring
 * time: reads the originals in src/assets, writes WebP derivatives to
 * public/img/<name>-<width>.webp and generates src/lib/static-images.ts (the
 * typed manifest the components import). Run: pnpm optimize:static-images.
 * Output is deterministic; re-running changes nothing unless a source or an
 * entry below changed. Nothing is optimized per request at runtime.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/img");
const MANIFEST = path.join(ROOT, "src/lib/static-images.ts");

interface Entry {
  /** Manifest key (camelCase) and file stem. */
  name: string;
  /** Source, relative to src/assets. */
  source: string;
  /** Wanted widths; capped at the intrinsic width, never upscaled. */
  widths: number[];
  /** Lossless WebP (the floor plan's thin lines stay crisp). */
  lossless?: boolean;
}

// Widths follow each use: 1x and 2x of the largest CSS box it renders in.
const PEEK = [320, 640]; // hover peeks (280 px) and the cursor preview (320 px)
const GRID = [360, 720]; // Outro grid: 25vw desktop, 50vw phone
const THUMB = [160, 320]; // Tarife: 120 px square
const REEL = [960]; // canvas reel frames
const TRANSITION = [1080]; // page-transition reel stills (intrinsic 1080)

const imp = (dir: string, file: string) => `impressionen/${dir}/${file}`;
const mk = (n: string) => imp("matthias-kappeler", `mk-${n}.jpg`);
const yvy = (n: string) => imp("matthias-kappeler-yvy", `yvy-${n}.jpg`);
const nb = (n: string) => imp("nicolas-burri", `nb-${n}.jpg`);

const ENTRIES: Entry[] = [
  // Intro: peeks + cursor preview
  { name: "boden", source: "studio/boden.jpg", widths: PEEK },
  { name: "kaffeemaschine", source: "studio/kaffeemaschine.jpg", widths: PEEK },
  { name: "mittagslicht", source: "studio/mittagslicht.jpg", widths: PEEK },
  { name: "panorama", source: "studio/panorama.jpg", widths: PEEK },
  {
    name: "shootingFlaeche",
    source: "studio/shooting-flaeche.jpg",
    widths: PEEK,
  },
  {
    name: "sichtVonDerKueche",
    source: "studio/sicht-von-der-kueche.jpg",
    widths: PEEK,
  },
  {
    name: "grundriss",
    source: "studio/grundriss.png",
    widths: [400, 800],
    lossless: true,
  },
  // Intro: still shown before WebGL is up (50vw desktop, padded 18%)
  { name: "chromeO", source: "studio/chrome-o.png", widths: [560, 1122] },
  // PageTransition reel
  { name: "studioImage1", source: "studio/image-1.jpg", widths: TRANSITION },
  { name: "studioImage2", source: "studio/image-2.jpg", widths: TRANSITION },
  // Tarife
  { name: "nb03", source: nb("03"), widths: THUMB },
  { name: "nb05", source: nb("05"), widths: THUMB },
  { name: "yvy02", source: yvy("02"), widths: THUMB },
  { name: "yvy06", source: yvy("06"), widths: THUMB },
  // Outro reel frames
  { name: "mk01", source: mk("01"), widths: REEL },
  { name: "mk02", source: mk("02"), widths: REEL },
  { name: "mk03", source: mk("03"), widths: REEL },
  { name: "mk05", source: mk("05"), widths: REEL },
  { name: "mk06", source: mk("06"), widths: REEL },
  { name: "yvy08", source: yvy("08"), widths: REEL },
  // Outro grid
  { name: "nb01", source: nb("01"), widths: GRID },
  { name: "nb02", source: nb("02"), widths: GRID },
  { name: "nb04", source: nb("04"), widths: GRID },
  { name: "nb06", source: nb("06"), widths: GRID },
  { name: "mk07", source: mk("07"), widths: GRID },
  { name: "mk09", source: mk("09"), widths: GRID },
  { name: "yvy01", source: yvy("01"), widths: GRID },
  { name: "yvy03", source: yvy("03"), widths: GRID },
  { name: "yvy04", source: yvy("04"), widths: GRID },
  { name: "yvy05", source: yvy("05"), widths: GRID },
  { name: "yvy07", source: yvy("07"), widths: GRID },
  { name: "yvy09", source: yvy("09"), widths: GRID },
];

function writeIfChanged(file: string, data: Buffer | string) {
  const next = typeof data === "string" ? Buffer.from(data) : data;
  if (existsSync(file) && readFileSync(file).equals(next)) return;
  writeFileSync(file, next);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const wanted = new Set<string>();
  const lines: string[] = [];

  for (const e of ENTRIES) {
    const input = path.join(ROOT, "src/assets", e.source);
    const meta = await sharp(input).metadata();
    const intrinsic = meta.width!;
    const widths = [
      ...new Set(e.widths.map((w) => Math.min(w, intrinsic))),
    ].sort((a, b) => a - b);
    const parts: string[] = [];
    let lastH = 0;
    for (const w of widths) {
      const file = `${e.name}-${w}.webp`;
      wanted.add(file);
      const out = await sharp(input)
        .resize({ width: w, withoutEnlargement: true })
        .webp(
          e.lossless
            ? { lossless: true, effort: 6 }
            : { quality: 80, effort: 6 },
        )
        .toBuffer({ resolveWithObject: true });
      writeIfChanged(path.join(OUT_DIR, file), out.data);
      parts.push(`/img/${file} ${w}w`);
      lastH = out.info.height;
    }
    const w = widths[widths.length - 1];
    lines.push(
      `  ${e.name}: {\n    src: "/img/${e.name}-${w}.webp",\n    srcSet: "${parts.join(", ")}",\n    width: ${w},\n    height: ${lastH},\n  },`,
    );
  }

  for (const f of readdirSync(OUT_DIR)) {
    if (f.endsWith(".webp") && !wanted.has(f)) {
      unlinkSync(path.join(OUT_DIR, f));
    }
  }

  writeIfChanged(
    MANIFEST,
    `// Generated by scripts/optimize-static-images.ts — do not edit.
// Run \`pnpm optimize:static-images\` after changing the script's image list.

export interface StaticImage {
  /** The largest derivative. */
  src: string;
  /** \`<url> <width>w, …\`, smallest first. */
  srcSet: string;
  /** Intrinsic size of \`src\`. */
  width: number;
  height: number;
}

export const staticImages = {
${lines.join("\n")}
} as const satisfies Record<string, StaticImage>;
`,
  );
  console.log(`${ENTRIES.length} images, ${wanted.size} files`);
}

void main();
