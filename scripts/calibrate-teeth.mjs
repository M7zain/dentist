import { writeFileSync } from "fs";
import { createRequire } from "module";
import { config } from "dotenv";

config({ path: ".env.local" });

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const UR = [18, 17, 16, 15, 14, 13, 12, 11];
const UL = [21, 22, 23, 24, 25, 26, 27, 28];
const LR = [48, 47, 46, 45, 44, 43, 42, 41];
const LL = [31, 32, 33, 34, 35, 36, 37, 38];

const imgPath = "public/images/dental-chart.png";
const { data, info } = await sharp(imgPath)
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function toothColor(x, y) {
  const i = (y * width + x) * channels;
  const r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  if (r > 205 && g > 205 && b > 205) return 0;
  if (g > 120 && g >= r - 5 && g > b) return 1;
  if (r > 130 && r > g + 5) return 2;
  if (r > 150 && g > 150 && b < 170) return 3;
  if (b > 110 && b > r) return 4;
  return 0;
}

const seen = new Uint8Array(width * height);
const blobs = [];

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * width + x;
    if (seen[idx]) continue;
    const c = toothColor(x, y);
    if (!c) continue;
    seen[idx] = 1;
    let minx = x,
      maxx = x,
      miny = y,
      maxy = y,
      sumx = 0,
      sumy = 0,
      n = 1;
    const q = [[x, y]];
    for (let qi = 0; qi < q.length; qi++) {
      const [cx, cy] = q[qi];
      sumx += cx;
      sumy += cy;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        const nx = cx + dx,
          ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (seen[ni] || !toothColor(nx, ny)) continue;
        seen[ni] = 1;
        n++;
        q.push([nx, ny]);
        minx = Math.min(minx, nx);
        maxx = Math.max(maxx, nx);
        miny = Math.min(miny, ny);
        maxy = Math.max(maxy, ny);
      }
    }
    if (n < 60) continue;
    blobs.push({
      x: Math.round(sumx / n),
      y: Math.round(sumy / n),
      r: Math.max(12, Math.ceil(Math.max(maxx - minx, maxy - miny) / 2) + 4),
      miny,
      maxy,
    });
  }
}

/** Merge crown+root blobs on same x column */
function mergeColumn(blist, jaw) {
  const sorted = [...blist].sort((a, b) => a.x - b.x);
  const merged = [];
  for (const b of sorted) {
    const prev = merged[merged.length - 1];
    if (prev && Math.abs(prev.x - b.x) < 12) {
      // Keep crown: upper = smaller y, lower = larger y
      const keep = jaw === "upper" ? (b.y < prev.y ? b : prev) : b.y > prev.y ? b : prev;
      merged[merged.length - 1] = {
        ...keep,
        r: Math.max(prev.r, b.r),
      };
    } else {
      merged.push({ ...b });
    }
  }
  return merged;
}

const upperRaw = blobs.filter((b) => b.miny < 200);
const lowerRaw = blobs.filter((b) => b.miny >= 200);

const upper = mergeColumn(upperRaw, "upper").sort((a, b) => a.x - b.x);
const lower = mergeColumn(lowerRaw, "lower").sort((a, b) => a.x - b.x);

console.log("upper", upper.length, upper.map((b) => `${b.x},${b.y}`).join(" "));
console.log("lower", lower.length);

if (upper.length !== 16 || lower.length !== 16) {
  console.error("Count mismatch", upper.length, lower.length);
  process.exit(1);
}

function map(fdis, pts, jaw) {
  return fdis.map((fdi, i) => ({
    fdi,
    x: pts[i].x,
    y: pts[i].y,
    r: pts[i].r,
    jaw,
  }));
}

const hits = [
  ...map([...UR, ...UL], upper, "upper"),
  ...map([...LR, ...LL], lower, "lower"),
];

const lines = [
  "// Auto-calibrated from public/images/dental-chart.png",
  `export const CHART_W = ${width};`,
  `export const CHART_H = ${height};`,
  "",
  "export type ToothHit = {",
  "  fdi: number;",
  "  x: number;",
  "  y: number;",
  "  r: number;",
  '  jaw: "upper" | "lower";',
  "};",
  "",
  `export const TOOTH_HITS: ToothHit[] = ${JSON.stringify(hits, null, 2)};`,
  "",
];

writeFileSync("lib/tooth-hits.generated.ts", lines.join("\n"));
console.log("OK", hits.length);
