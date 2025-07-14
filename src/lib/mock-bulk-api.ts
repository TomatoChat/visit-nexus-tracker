export interface MockApiError {
  row: number; // 1-indexed, corresponding to spreadsheet row (including header)
  error: string;
}

export interface MockApiResponse<T = any> {
  success: boolean;
  message: string;
  errors?: MockApiError[];
  data?: T[]; // Could return processed/inserted data on success
}

// --- Companies ---
const MOCK_COMPANY_DB_EMAILS = new Set<string>(); // Simulate unique email constraint for a related field if any

export const mockBulkUploadCompanies = (data: any[]): Promise<MockApiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const errors: MockApiError[] = [];

      // Simulate some backend validation
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const userRowIndex = i + 2; // Excel row number (data starts at row 2)

        // --- Address related validation (applies if new address is created) ---
        const city = String(row['Città'] || '').trim();
        let latitude = row['Latitude'];
        let longitude = row['Longitude'];

        if (latitude === undefined || latitude === null || String(latitude).trim() === '' ||
            longitude === undefined || longitude === null || String(longitude).trim() === '') {
          // Simulate geocoding attempt
          if (city.toLowerCase() === 'geocode fail city') {
            errors.push({ row: userRowIndex, error: `Geocoding fallito per ${city}. Latitudine e Longitudine sono obbligatorie.` });
          } else if (city) {
            // Simulate successful geocoding for other cities
            row['Latitude'] = (Math.random() * 180 - 90).toFixed(6); // Mocked Lat
            row['Longitude'] = (Math.random() * 360 - 180).toFixed(6); // Mocked Lng
            console.log(`Mock geocoding for ${city}: Lat ${row['Latitude']}, Lng ${row['Longitude']}`);
          } else {
            // City itself is missing, which is caught by client-side validation, but double check
            errors.push({ row: userRowIndex, error: `Città mancante, impossibile geocodificare. Latitudine e Longitudine sono obbligatorie.` });
          }
        }
        // --- End Address Validation ---

        // Example: Partita IVA must be 11 digits (very basic check)
        const piva = String(row['Partita IVA'] || '').trim();
        if (!/^\d{11}$/.test(piva)) {
          errors.push({ row: userRowIndex, error: `Partita IVA "${piva}" non è valida (deve essere di 11 cifre).` });
        }

        // Example: Company name must not be "Test Invalid" (simulating a backend business rule)
        if (String(row['Nome Azienda'] || '').trim().toLowerCase() === 'test invalid') {
          errors.push({ row: userRowIndex, error: 'Il nome azienda "Test Invalid" non è permesso.' });
        }
      }

      if (errors.length > 0) {
        resolve({
          success: false,
          message: `Caricamento fallito. ${errors.length} righe contengono errori.`,
          errors,
        });
      } else {
        // Simulate successful insertion for all rows
        resolve({
          success: true,
          message: `Successo! ${data.length} nuove aziende sono state aggiunte.`,
          data: data.map(d => ({ ...d, id: `mock_id_${Math.random().toString(36).substr(2, 9)}` })),
        });
      }
    }, 1500); // Simulate network delay
  });
};

// --- Selling Points ---
export const mockBulkUploadSellingPoints = (data: any[]): Promise<MockApiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const errors: MockApiError[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const userRowIndex = i + 2;

            // Example: ID Azienda Cliente must be a positive number (basic check)
    const sellerId = String(row['ID Azienda Cliente'] || '').trim();
    if (!/^\d+$/.test(sellerId) || parseInt(sellerId, 10) <= 0) {
      errors.push({ row: userRowIndex, error: `ID Azienda Cliente "${sellerId}" non è valido.`});
        }

        // --- Address related validation (applies if new address is created) ---
        const city = String(row['Città'] || '').trim();
        let latitude = row['Latitude'];
        let longitude = row['Longitude'];

        if (latitude === undefined || latitude === null || String(latitude).trim() === '' ||
            longitude === undefined || longitude === null || String(longitude).trim() === '') {
          if (city.toLowerCase() === 'geocode fail city') {
            errors.push({ row: userRowIndex, error: `Geocoding fallito per ${city}. Latitudine e Longitudine sono obbligatorie.` });
          } else if (city) {
            row['Latitude'] = (Math.random() * 180 - 90).toFixed(6);
            row['Longitude'] = (Math.random() * 360 - 180).toFixed(6);
             console.log(`Mock geocoding for SP ${city}: Lat ${row['Latitude']}, Lng ${row['Longitude']}`);
          } else {
            errors.push({ row: userRowIndex, error: `Città mancante, impossibile geocodificare per SP. Latitudine e Longitudine sono obbligatorie.` });
          }
        }
        // --- End Address Validation ---

         // Example: Nome Punto Vendita cannot be "Forbidden Name"
        if (String(row['Nome Punto Vendita'] || '').trim().toLowerCase() === 'forbidden name') {
          errors.push({ row: userRowIndex, error: 'Il nome "Forbidden Name" non è permesso per i punti vendita.' });
        }
      }

      if (errors.length > 0) {
        resolve({ success: false, message: `Caricamento Punti Vendita fallito. ${errors.length} errori.`, errors });
      } else {
        resolve({ success: true, message: `Successo! ${data.length} nuovi punti vendita aggiunti.` });
      }
    }, 1000);
  });
};

// --- People ---
const MOCK_PEOPLE_DB_EMAILS = new Set<string>();
export const mockBulkUploadPeople = (data: any[]): Promise<MockApiResponse> => {
  MOCK_PEOPLE_DB_EMAILS.clear(); // Reset for each bulk operation for simplicity in mock
  return new Promise((resolve) => {
    setTimeout(() => {
      const errors: MockApiError[] = [];
      const currentBatchEmails = new Set<string>();

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const userRowIndex = i + 2;
        const email = String(row['Email'] || '').trim().toLowerCase();

        if (MOCK_PEOPLE_DB_EMAILS.has(email) || currentBatchEmails.has(email)) {
          errors.push({ row: userRowIndex, error: `Email "${email}" esiste già o è duplicata nel file.` });
        } else {
          currentBatchEmails.add(email);
        }
        // Example: Cognome cannot be "Rossi"
        if (String(row['Cognome'] || '').trim().toLowerCase() === 'rossi') {
          errors.push({ row: userRowIndex, error: 'Il cognome "Rossi" non è accettato per nuove persone.' });
        }
      }

      if (errors.length > 0) {
        resolve({ success: false, message: `Caricamento Persone fallito. ${errors.length} errori.`, errors });
      } else {
        // Add successfully validated emails to the "DB"
        currentBatchEmails.forEach(email => MOCK_PEOPLE_DB_EMAILS.add(email));
        resolve({ success: true, message: `Successo! ${data.length} nuove persone aggiunte.` });
      }
    }, 1200);
  });
};

// --- Activities ---
export const mockBulkUploadActivities = (data: any[]): Promise<MockApiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const errors: MockApiError[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const userRowIndex = i + 2;
        if (String(row['Nome Attività'] || '').trim().toLowerCase() === 'invalid activity') {
          errors.push({ row: userRowIndex, error: 'Nome attività "invalid activity" non permesso.' });
        }
      }
      if (errors.length > 0) {
        resolve({ success: false, message: `Caricamento Attività fallito. ${errors.length} errori.`, errors });
      } else {
        resolve({ success: true, message: `Successo! ${data.length} nuove attività aggiunte.` });
      }
    }, 800);
  });
};
