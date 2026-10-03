// Regenerates app/favicon.ico from the brand mark in app/icon.svg (ADR 0032).
//
// Re-run from the repository root after the mark or the tile colour changes:
//   node web/scripts/generate-favicon.mjs
// Needs `rsvg-convert` (brew install librsvg) and ImageMagick's `magick`.
//
// The mark's path data is taken from icon.svg, not copied here, so the two
// files cannot drift apart. Each size is rendered from vector with its own
// tuning: the 16 and 24px frames carry only the centre figure, because the
// full three-figure mark turns into a pale blob at that size.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "app");
const SOURCE_SVG = join(APP_DIR, "icon.svg");
const TARGET_ICO = join(APP_DIR, "favicon.ico");

const TILE_COLOUR = "#1E4A40";
// The mark's own viewBox is 32x26 (shared/ui/icons/app-mark-icon.tsx).
const MARK_WIDTH = 32;
const MARK_HEIGHT = 26;
// The centre figure spans x 7.7..24.3 of the 32-wide viewBox.
const CENTRE_WIDTH = 16.6;
const CENTRE_LEFT = 7.7;

// size: frame edge in px; radius: corner radius as a share of the tile.
// Full frames (figures: "all") draw the whole composition; mark is the mark
// width as a share of the tile and sideOpacity the opacity of the flanking
// figures (icon.svg uses 0.545 / 0.5). Simplified frames (figures:
// "centre") draw only the centre figure in solid white; mark is then that
// figure's width as a share of the tile. At 16-24px three figures merge
// into one pale mass, so the small frames keep a single silhouette. Do not
// "restore" the full mark there (ADR 0032, update).
const FRAMES = [
  { size: 16, figures: "centre", mark: 0.66, radius: 0.18 },
  { size: 24, figures: "centre", mark: 0.64, radius: 0.2 },
  { size: 32, figures: "all", mark: 0.74, radius: 0.22, sideOpacity: 0.65 },
  { size: 48, figures: "all", mark: 0.62, radius: 0.27, sideOpacity: 0.55 },
  { size: 64, figures: "all", mark: 0.545, radius: 0.318, sideOpacity: 0.5 },
];

const readMarkPaths = () => {
  const svg = readFileSync(SOURCE_SVG, "utf8");
  const inner = svg.match(/<g [^>]*>([\s\S]*?)<\/g>/);
  if (!inner) throw new Error("No <g> mark group found in icon.svg");
  const paths = inner[1].match(/<path[\s\S]*?\/>/g);
  if (paths?.length !== 3) throw new Error("Expected three figures in icon.svg");
  return paths;
};

const buildFrameSvg = (paths, frame) => {
  const { size, figures, mark, radius, sideOpacity } = frame;
  let body;
  if (figures === "centre") {
    const scale = (size * mark) / CENTRE_WIDTH;
    const x = (size - CENTRE_WIDTH * scale) / 2 - CENTRE_LEFT * scale;
    const y = (size - MARK_HEIGHT * scale) / 2;
    body = `<g transform="translate(${x} ${y}) scale(${scale})">${paths[2]}</g>`;
  } else {
    const scale = (size * mark) / MARK_WIDTH;
    const x = (size - MARK_WIDTH * scale) / 2;
    const y = (size - MARK_HEIGHT * scale) / 2;
    const tinted = paths
      .join("")
      .replaceAll("fill-opacity=\"0.5\"", `fill-opacity="${sideOpacity}"`);
    body = `<g transform="translate(${x} ${y}) scale(${scale})">${tinted}</g>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
<rect width="${size}" height="${size}" rx="${size * radius}" fill="${TILE_COLOUR}"/>
${body}
</svg>`;
};

const main = () => {
  const paths = readMarkPaths();
  const work = mkdtempSync(join(tmpdir(), "favicon-"));
  try {
    const pngs = FRAMES.map((frame) => {
      const svgPath = join(work, `${frame.size}.svg`);
      const pngPath = join(work, `${frame.size}.png`);
      writeFileSync(svgPath, buildFrameSvg(paths, frame));
      execFileSync("rsvg-convert", [
        "-w", String(frame.size), "-h", String(frame.size),
        "-o", pngPath, svgPath,
      ]);
      return pngPath;
    });
    execFileSync("magick", [...pngs, TARGET_ICO]);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
};

main();
