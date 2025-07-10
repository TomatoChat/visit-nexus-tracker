import React, { useState, useEffect, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import CompanyManagement from '@/components/data-management/CompanyManagement';
import BulkUploadDialog from '@/components/data-management/BulkUploadDialog';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAndDownloadXlsxTemplate, parseXlsxFile } from '@/lib/xlsx-utils';
import { mockBulkUploadCompanies } from '@/lib/mock-bulk-api'; // Import mock API

const COMPANY_TEMPLATE_HEADERS = [
  'Nome Azienda', // companyName (Required)
  'Partita IVA', // companyVat (Required)
  'Tipo Azienda (supplier/seller)', // currentCompanyType: 'supplier' | 'seller' (Required)
  'Via', // addressForm.addressLine1 (Required if new address - which is assumed)
  'Civico', // addressForm.addressLine2 (optional, but good to have a column)
  'Città', // addressForm.city (Required)
  'Provincia', // addressForm.stateProvince (Required)
  'CAP', // addressForm.postalCode (Optional)
  'Nazione', // addressForm.country (Required)
  'Latitude (Opzionale)', // addressForm.latitude
  'Longitude (Opzionale)', // addressForm.longitude
  'ID Categoria (Opzionale)', // selectedCategoryId
];

const Companies = () => {
  const { userRole, loading, checkCanManageData } = useRoles();
  const { toast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerAddForm, setTriggerAddForm] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [canManage, setCanManage] = useState(false); // State for RBAC result
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false); // State for dialog

  useEffect(() => {
    const verifyPermissions = async () => {
      const result = await checkCanManageData();
      setCanManage(result);
    };
    if (!loading) {
      verifyPermissions();
    }
  }, [loading, checkCanManageData]);

  // Placeholder handlers for the dialog
  const handleDownloadTemplate = useCallback(() => {
    generateAndDownloadXlsxTemplate(COMPANY_TEMPLATE_HEADERS, 'Companies');
    toast({ title: 'Template Downloaded', description: 'Il file template_companies.xlsx è stato scaricato.' });
  }, [toast]);

  const handleFileUpload = useCallback(async (file: File) => {
    toast({ title: 'Elaborazione file...', description: 'Lettura e validazione del file XLSX caricato.' });
    // Dialog state will be managed based on outcomes.

    try {
      const rows = await parseXlsxFile<any>(file);

      if (!rows || rows.length === 0) {
        toast({ variant: 'destructive', title: 'Errore di Validazione', description: 'Il file caricato è vuoto o non contiene righe di dati.' });
        // setIsBulkUploadOpen(false); // Keep dialog open to show error, or let user close.
        return;
      }

      // Client-side validation for Companies
      // Headers are 1-indexed for user feedback, rows are 0-indexed from parser
      const requiredCompanyHeaders = ['Nome Azienda', 'Partita IVA', 'Tipo Azienda (supplier/seller)'];
      // Per "Crucial Assumption": For Companies and Selling Points, the template must include all necessary address fields...
      // The system should assume a new address is created for every row.
      const requiredAddressHeaders = ['Via', 'Città', 'Provincia', 'Nazione'];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const userRowIndex = i + 2; // Excel row number (1 for headers, data starts at 2)

        // Check required company fields
        for (const header of requiredCompanyHeaders) {
          if (row[header] === undefined || row[header] === null || String(row[header]).trim() === '') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "${header}" è mancante o vuoto.` });
            return;
          }
        }

        // Validate 'Tipo Azienda (supplier/seller)'
        const tipoAzienda = String(row['Tipo Azienda (supplier/seller)']).toLowerCase().trim();
        if (tipoAzienda !== 'supplier' && tipoAzienda !== 'seller') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "Tipo Azienda (supplier/seller)" deve essere 'supplier' o 'seller'. Trovato: "${row['Tipo Azienda (supplier/seller)']}".` });
            return;
        }

        // Check required address fields
        for (const header of requiredAddressHeaders) {
          if (row[header] === undefined || row[header] === null || String(row[header]).trim() === '') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo indirizzo "${header}" è mancante o vuoto.` });
            return;
          }
        }
      }

      // If client-side validation passes, proceed to mock API call
      toast({ title: 'Validazione OK', description: `${rows.length} righe pronte. Inizio caricamento simulato...` });

      const apiResponse = await mockBulkUploadCompanies(rows);

      if (apiResponse.success) {
        toast({ title: 'Successo!', description: apiResponse.message });
        setIsBulkUploadOpen(false); // Close dialog on success
        // Here you might want to trigger a refresh of the main data table
        // e.g., by calling a prop function or a context update
      } else {
        let errorMessage = apiResponse.message;
        if (apiResponse.errors && apiResponse.errors.length > 0) {
          // For simplicity, show the first error in detail, or a summary.
          // A more complex UI could list all errors.
          const firstError = apiResponse.errors[0];
          errorMessage = `Errore principale: ${apiResponse.message}. Primo errore dettaglio: Riga ${firstError.row}: ${firstError.error}`;
           toast({
            variant: 'destructive',
            title: 'Caricamento Fallito',
            description: errorMessage,
            duration: 10000, // Longer duration for detailed errors
          });
          console.error('API Errors:', apiResponse.errors);
        } else {
           toast({
            variant: 'destructive',
            title: 'Caricamento Fallito',
            description: errorMessage,
          });
        }
        // Keep dialog open if there are errors from API
      }

    } catch (error: any) { // Catches errors from parseXlsxFile or other unexpected issues
      console.error("Errore durante l'elaborazione del file XLSX o chiamata API:", error);
      toast({ variant: 'destructive', title: 'Errore Critico', description: error.message || 'Impossibile completare l\'operazione.' });
      // Keep dialog open
    }
  }, [toast, setIsBulkUploadOpen]);


  // Show loading state while determining user role & permissions
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // If user has no role or is guest, show access denied
  if (!userRole || userRole === 'guest') {
    return (
      <Layout>
        <div className="min-h-screen w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-red-600">Access Denied</div>
          </div>
        </div>
      </Layout>
    );
  }

  // External agents cannot access this page
  if (userRole === 'externalAgent') {
    return (
      <Layout>
        <div className="min-h-screen w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-red-600">Access Denied</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button, title, and actions */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-gray-800">Aziende</h1>
          </div>
          <div className="flex items-center gap-2">
            {!showSearch && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerca"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
            {showSearch && (
              <Input
                ref={searchInputRef}
                autoFocus
                className="w-32"
                placeholder="Cerca..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            {/* Existing Add Button - RBAC for this is: !userRole?.includes('internalAgent') */}
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Azienda"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            {/* New Bulk Upload Button - RBAC: canManage (derived from checkCanManageData) */}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50"
                onClick={() => setIsBulkUploadOpen(true)}
                aria-label="Caricamento Massivo Aziende"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        {/* Desktop: Title and actions */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-left">Aziende</h1>
          <div className="flex items-center gap-2">
            {!showSearch && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerca"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
            {showSearch && (
              <Input
                ref={searchInputRef}
                autoFocus
                className="w-48"
                placeholder="Cerca aziende..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            {/* Existing Add Button */}
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Azienda"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            {/* New Bulk Upload Button */}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50"
                onClick={() => setIsBulkUploadOpen(true)}
                aria-label="Caricamento Massivo Aziende"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        <CompanyManagement
          readOnly={userRole === 'internalAgent'}
          searchTerm={searchTerm}
          triggerAddForm={triggerAddForm}
          onAddFormShown={() => setTriggerAddForm(false)}
        />
        {canManage && (
          <BulkUploadDialog
            entityName="Aziende" // Corrected entity name for consistency
            isOpen={isBulkUploadOpen}
            onClose={() => setIsBulkUploadOpen(false)}
            onDownloadTemplate={handleDownloadTemplate}
            onFileUpload={handleFileUpload}
          />
        )}
      </div>
    </Layout>
  );
};

export default Companies; 