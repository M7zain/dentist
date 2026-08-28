// Calibrated from public/images/dental-chart.png — crown positions
export const CHART_W = 263;
export const CHART_H = 427;

export type ToothHit = {
  fdi: number;
  x: number;
  y: number;
  r: number;
  jaw: "upper" | "lower";
};

export const TOOTH_HITS: ToothHit[] = [
  { fdi: 18, x: 51, y: 150, r: 20, jaw: "upper" },
  { fdi: 17, x: 57, y: 115, r: 22, jaw: "upper" },
  { fdi: 16, x: 65, y: 86, r: 17, jaw: "upper" },
  { fdi: 15, x: 74, y: 65, r: 16, jaw: "upper" },
  { fdi: 14, x: 88, y: 47, r: 16, jaw: "upper" },
  { fdi: 13, x: 106, y: 36, r: 16, jaw: "upper" },
  { fdi: 12, x: 128, y: 30, r: 17, jaw: "upper" },
  { fdi: 11, x: 153, y: 30, r: 17, jaw: "upper" },
  { fdi: 21, x: 175, y: 36, r: 16, jaw: "upper" },
  { fdi: 22, x: 193, y: 47, r: 16, jaw: "upper" },
  { fdi: 23, x: 208, y: 65, r: 15, jaw: "upper" },
  { fdi: 24, x: 216, y: 86, r: 16, jaw: "upper" },
  { fdi: 25, x: 225, y: 115, r: 22, jaw: "upper" },
  { fdi: 26, x: 218, y: 132, r: 18, jaw: "upper" },
  { fdi: 27, x: 224, y: 148, r: 18, jaw: "upper" },
  { fdi: 28, x: 230, y: 150, r: 20, jaw: "upper" },
  { fdi: 48, x: 52, y: 240, r: 20, jaw: "lower" },
  { fdi: 47, x: 59, y: 272, r: 19, jaw: "lower" },
  { fdi: 46, x: 70, y: 304, r: 21, jaw: "lower" },
  { fdi: 45, x: 78, y: 332, r: 17, jaw: "lower" },
  { fdi: 44, x: 87, y: 353, r: 15, jaw: "lower" },
  { fdi: 43, x: 99, y: 372, r: 14, jaw: "lower" },
  { fdi: 42, x: 117, y: 381, r: 13, jaw: "lower" },
  { fdi: 41, x: 133, y: 385, r: 12, jaw: "lower" },
  { fdi: 31, x: 149, y: 385, r: 12, jaw: "lower" },
  { fdi: 32, x: 165, y: 381, r: 13, jaw: "lower" },
  { fdi: 33, x: 182, y: 372, r: 14, jaw: "lower" },
  { fdi: 34, x: 195, y: 353, r: 15, jaw: "lower" },
  { fdi: 35, x: 203, y: 332, r: 17, jaw: "lower" },
  { fdi: 36, x: 212, y: 304, r: 21, jaw: "lower" },
  { fdi: 37, x: 222, y: 272, r: 19, jaw: "lower" },
  { fdi: 38, x: 230, y: 240, r: 20, jaw: "lower" },
];
