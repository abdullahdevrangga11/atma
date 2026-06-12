/**
 * Tiny file-download helpers. CSV does basic RFC 4180 escaping; JSON is
 * pretty-printed. Both work in any modern browser via the URL.createObjectURL
 * + anchor-click trick.
 */

export function downloadCSV(rows: Array<Record<string, unknown>>, filename: string) {
  if (rows.length === 0) {
    download("text/csv", "", filename);
    return;
  }
  const cols = Object.keys(rows[0]);
  const header = cols.join(",");
  const body = rows
    .map((r) =>
      cols
        .map((c) => csvCell(r[c]))
        .join(","),
    )
    .join("\n");
  download("text/csv;charset=utf-8", `${header}\n${body}\n`, filename);
}

export function downloadJSON(payload: unknown, filename: string) {
  download("application/json;charset=utf-8", JSON.stringify(payload, null, 2), filename);
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : String(v);
  // Per RFC 4180: quote if cell contains comma, quote, or newline.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function download(mime: string, content: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
