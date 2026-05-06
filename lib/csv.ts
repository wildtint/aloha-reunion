export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(csvEscape).join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  // Prepend a UTF-8 BOM so Excel correctly detects encoding
  return `﻿${headerLine}\n${body}\n`;
}
