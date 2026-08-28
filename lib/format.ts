export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ar-SY", {
    style: "currency",
    currency: "SYP",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat("ar-SY").format(amount || 0);
}

export function toWhatsAppLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function normalizeSyrianPhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("963")) return `+${digits}`;
  return `+963${digits}`;
}

/** FDI permanent dentition */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
