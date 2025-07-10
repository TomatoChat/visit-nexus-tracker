import * as XLSX from 'xlsx';

/**
 * Generates an XLSX file from an array of headers and initiates a download.
 * @param headers An array of strings representing the column headers.
 * @param entityName The name of the entity, used for naming the file (e.g., "Companies").
 * @param sheetName Optional name for the sheet within the XLSX file. Defaults to "Data".
 */
export const generateAndDownloadXlsxTemplate = (
  headers: string[],
  entityName: string,
  sheetName: string = 'Data'
): void => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create a worksheet with just the headers
  // worksheet_from_json requires an array of objects, so we create a dummy data row
  // which we will then ignore by only considering the headers.
  // A simpler way is to use aoa_to_sheet with just the header row.
  const worksheetData = [headers]; // Array of arrays, headers as the first row
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate the file name
  const fileName = `template_${entityName.toLowerCase().replace(/\s+/g, '_')}.xlsx`;

  // Write the workbook and trigger download
  XLSX.writeFile(workbook, fileName);
};

/**
 * Parses an XLSX file and returns its content as an array of objects.
 * Each object represents a row, with keys derived from the header row.
 * @param file The .xlsx file to parse.
 * @returns A promise that resolves to an array of row objects.
 */
export const parseXlsxFile = <T extends {}>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryString = event.target?.result;
        if (!binaryString) {
          throw new Error('File content is empty or could not be read.');
        }
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
};
