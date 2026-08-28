import fs from "fs";

const src = fs.readFileSync(
  "node_modules/react-odontogram/dist/index.mjs",
  "utf8"
);

function pathCentroid(d) {
  const nums = d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  const xs = [];
  const ys = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]);
    ys.push(nums[i + 1]);
  }
  if (!xs.length) return null;
  return {
    x: xs.reduce((a, b) => a + b, 0) / xs.length,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  };
}

function applyTransform(x, y, transform) {
  let nx = x;
  let ny = y;
  if (!transform) return { x: nx, y: ny };
  const parts = transform.match(/(scale|translate)\(([^)]+)\)/g) ?? [];
  // SVG applies transform list right-to-left
  for (const part of parts.slice().reverse()) {
    if (part.startsWith("scale")) {
      const [sx, sy] = part
        .slice(6, -1)
        .split(",")
        .map((v) => Number(v.trim()));
      nx *= sx;
      ny *= sy;
    } else if (part.startsWith("translate")) {
      const [tx, ty] = part
        .slice(10, -1)
        .split(",")
        .map((v) => Number(v.trim()));
      nx += tx;
      ny += ty ?? 0;
    }
  }
  return { x: nx, y: ny };
}

const o1Start = src.indexOf('var o1=[');
const o1End = src.indexOf("],r1=[", o1Start);
const o1Block = src.slice(o1Start, o1End);

const shadows = [];
const re = /shadowPath:"([^"]+)"/g;
let m;
while ((m = re.exec(o1Block))) shadows.push(m[1]);

const quadrants = [
  { name: "first", transform: "", prefix: 10 },
  { name: "second", transform: "scale(-1, 1) translate(-409, 0)", prefix: 20 },
  { name: "third", transform: "scale(1, -1) translate(0, -694)", prefix: 40 },
  { name: "fourth", transform: "scale(-1, -1) translate(-409, -694)", prefix: 30 },
];

const teeth = [];
for (const quad of quadrants) {
  shadows.forEach((shadow, idx) => {
    const local = pathCentroid(shadow);
    if (!local) return;
    const global = applyTransform(local.x, local.y, quad.transform);
    teeth.push({ fdi: quad.prefix + (idx + 1), x: global.x, y: global.y });
  });
}

teeth.sort((a, b) => a.fdi - b.fdi);
console.log("odontogram teeth", teeth.length);
console.log(
  "sample raw",
  teeth.filter((t) => [11, 18, 21, 28, 41, 48].includes(t.fdi))
);

const hitsSrc = fs.readFileSync("lib/tooth-hits.generated.ts", "utf8");
const hitRe = /\{ fdi: (\d+), x: ([\d.]+), y: ([\d.]+)/g;
const imageHits = [];
while ((m = hitRe.exec(hitsSrc))) {
  imageHits.push({
    fdi: Number(m[1]),
    x: Number(m[2]),
    y: Number(m[3]),
  });
}

const O_W = 409;
const O_H = 694;
const I_W = 263;
const I_H = 427;

function fitAxis(odontVals, imageVals) {
  const n = odontVals.length;
  const meanO = odontVals.reduce((a, b) => a + b, 0) / n;
  const meanI = imageVals.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (odontVals[i] - meanO) * (imageVals[i] - meanI);
    den += (odontVals[i] - meanO) ** 2;
  }
  const scale = den === 0 ? 1 : num / den;
  const translate = meanI - scale * meanO;
  return { scale, translate };
}

function bestTransform(samples) {
  const xs = fitAxis(
    samples.map((s) => s.odont.x),
    samples.map((s) => s.image.x)
  );
  const ys = fitAxis(
    samples.map((s) => s.odont.y),
    samples.map((s) => s.image.y)
  );
  let err = 0;
  for (const s of samples) {
    const px = s.odont.x * xs.scale + xs.translate;
    const py = s.odont.y * ys.scale + ys.translate;
    err += (px - s.image.x) ** 2 + (py - s.image.y) ** 2;
  }
  return {
    scaleX: xs.scale,
    scaleY: ys.scale,
    tx: xs.translate,
    ty: ys.translate,
    err,
  };
}

const samples = teeth
  .map((t) => {
    const img = imageHits.find((h) => h.fdi === t.fdi);
    return img ? { odont: t, image: img } : null;
  })
  .filter(Boolean);

console.log("matched samples", samples.length);
const transform = bestTransform(samples);
console.log("transform", transform);
console.log("rmse", Math.sqrt(transform.err / samples.length).toFixed(2), "px");
for (const s of samples.filter((x) => [11, 21, 31, 41].includes(x.odont.fdi))) {
  const px = s.odont.x * transform.scaleX + transform.tx;
  const py = s.odont.y * transform.scaleY + transform.ty;
  console.log(
    "fdi",
    s.odont.fdi,
    "img",
    s.image.x,
    s.image.y,
    "odont",
    px.toFixed(1),
    py.toFixed(1)
  );
}

const out = `// Auto-calibrated react-odontogram overlay for dental-chart.png
export const ODONTOGRAM_VIEWBOX = { w: ${O_W}, h: ${O_H} } as const;
export const CHART_IMAGE_SIZE = { w: ${I_W}, h: ${I_H} } as const;
export const ODONTOGRAM_ALIGN = {
  scaleX: ${transform.scaleX.toFixed(6)},
  scaleY: ${transform.scaleY.toFixed(6)},
  translateX: ${transform.tx.toFixed(2)},
  translateY: ${transform.ty.toFixed(2)},
} as const;
`;

fs.writeFileSync("lib/odontogram-align.generated.ts", out);
console.log("wrote lib/odontogram-align.generated.ts");
