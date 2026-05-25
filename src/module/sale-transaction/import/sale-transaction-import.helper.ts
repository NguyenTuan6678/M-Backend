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
