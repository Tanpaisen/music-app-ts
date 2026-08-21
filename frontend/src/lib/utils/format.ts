// Rút gọn số lớn kiểu "12.3k" — dùng cho lượt thích, lượt nghe
export function formatCompactNumber(n?: number): string {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
