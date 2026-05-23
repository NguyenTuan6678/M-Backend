import { Worksheet } from 'exceljs';

export function getCellString(
  row: any,
  headerMap: Map<string, number>,
  key: string,
): string {
  const index = headerMap.get(key);
  if (!index) return '';

  const value = row.getCell(index).value;

  if (value === null || value === undefined) return '';

  if (typeof value === 'object' && 'text' in value) {
    return String((value as any).text).trim();
  }

  if (typeof value === 'object' && 'result' in value) {
    return String((value as any).result ?? '').trim();
  }

  return String(value).trim();
}

export function getCellNumber(
  row: any,
  headerMap: Map<string, number>,
  key: string,
  defaultValue = 0,
): number {
  const raw = getCellString(row, headerMap, key);

  if (raw === '') return defaultValue;

  const number = Number(raw);

  return Number.isNaN(number) ? defaultValue : number;
}

export function buildHeaderMap(sheet: Worksheet): Map<string, number> {
  const headerRow = sheet.getRow(1);
  const map = new Map<string, number>();

  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value ?? '').trim();
    if (key) {
      map.set(key, colNumber);
    }
  });

  return map;
}

export function isEmptyExcelRow(row: any): boolean {
  let hasValue = false;

  row.eachCell((cell: any) => {
    if (
      cell.value !== null &&
      cell.value !== undefined &&
      String(cell.value).trim() !== ''
    ) {
      hasValue = true;
    }
  });

  return !hasValue;
}
