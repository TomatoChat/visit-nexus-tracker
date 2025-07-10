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
import { generateAndDownloadXlsxTemplate, parseXlsxFile, parseCsvFile } from '@/lib/xlsx-utils';
import { mockBulkUploadCompanies } from '@/lib/mock-bulk-api'; // Import mock API
import { useCompanyCategories } from '@/hooks/use-data';
import { supabase } from '@/integrations/supabase/client';

const COMPANY_TEMPLATE_HEADERS = [
  'Nome Azienda', // companyName (Required)
  'Partita IVA', // companyVat (Required)
  'È Fornitore (Sì/No)', // isSupplier: boolean (Required)
  'È Venditore (Sì/No)', // isSeller: boolean (Required)
  'Via', // addressForm.addressLine1 (Required if new address - which is assumed)
  'Civico (Opzionale)', // addressForm.addressLine2 (optional)
  'Città', // addressForm.city (Required)
  'Provincia', // addressForm.stateProvince (Required)
  'CAP (Opzionale)', // addressForm.postalCode (Optional)
  'Nazione', // addressForm.country (Required)
  'Latitude', // addressForm.latitude (Required in database)
  'Longitude', // addressForm.longitude (Required in database)
  'ID Categoria', // selectedCategoryId (Required in database)
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
  
  // Fetch company categories for dropdown
  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useCompanyCategories();

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
  const handleDownloadTemplate = useCallback(async () => {
    // Force refetch categories to get the latest data
    const { data: freshCategories } = await refetchCategories();
    const currentCategories = freshCategories || categories;
    
    // Create reference data for categories
    const referenceData = {
      'Categorie Aziende': [
        ['ID Categoria', 'Nome Categoria', 'Tipo Fornitore', 'Tipo Venditore'],
        ...currentCategories.map(cat => [
          cat.id,
          cat.name,
          cat.supplierCategory ? 'Sì' : 'No',
          cat.sellerCategory ? 'Sì' : 'No'
        ])
      ]
    };
    
    generateAndDownloadXlsxTemplate(COMPANY_TEMPLATE_HEADERS, 'Companies', 'Data', referenceData);
    toast({ title: 'Template Downloaded', description: 'Il file template_companies.xlsx è stato scaricato.' });
  }, [toast, categories, refetchCategories]);

  const handleFileUpload = useCallback(async (file: File) => {
    toast({ title: 'Elaborazione file...', description: 'Lettura e validazione del file caricato.' });
    try {
      let rows: any[] = [];
      if (file.name.endsWith('.csv')) {
        rows = await parseCsvFile<any>(file);
      } else {
        rows = await parseXlsxFile<any>(file);
      }
      if (!rows || rows.length === 0) {
        toast({ variant: 'destructive', title: 'Errore di Validazione', description: 'Il file caricato è vuoto o non contiene righe di dati.' });
        return;
      }

      // Client-side validation for Companies
      // Headers are 1-indexed for user feedback, rows are 0-indexed from parser
      const requiredCompanyHeaders = ['Nome Azienda', 'Partita IVA', 'È Fornitore (Sì/No)', 'È Venditore (Sì/No)', 'ID Categoria'];
      // Per "Crucial Assumption": For Companies and Selling Points, the template must include all necessary address fields...
      // The system should assume a new address is created for every row.
      const requiredAddressHeaders = ['Via', 'Città', 'Provincia', 'Nazione', 'Latitude', 'Longitude'];

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

        // Validate 'È Fornitore (Sì/No)'
        const isSupplier = String(row['È Fornitore (Sì/No)']).toLowerCase().trim();
        if (isSupplier !== 'sì' && isSupplier !== 'si' && isSupplier !== 'yes' && isSupplier !== 'true' && isSupplier !== '1' && 
            isSupplier !== 'no' && isSupplier !== 'false' && isSupplier !== '0') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "È Fornitore (Sì/No)" deve essere 'Sì' o 'No'. Trovato: "${row['È Fornitore (Sì/No)']}".` });
            return;
        }

        // Validate 'È Venditore (Sì/No)'
        const isSeller = String(row['È Venditore (Sì/No)']).toLowerCase().trim();
        if (isSeller !== 'sì' && isSeller !== 'si' && isSeller !== 'yes' && isSeller !== 'true' && isSeller !== '1' && 
            isSeller !== 'no' && isSeller !== 'false' && isSeller !== '0') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "È Venditore (Sì/No)" deve essere 'Sì' o 'No'. Trovato: "${row['È Venditore (Sì/No)']}".` });
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

      // --- REAL BULK UPLOAD LOGIC ---
      // All-or-nothing: if any insert fails, abort and show error
      let insertedCompanies = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // 1. Insert address
        const { data: address, error: addressError } = await supabase.from('addresses').insert({
          addressLine1: row['Via'],
          addressLine2: row['Civico (Opzionale)'] || null,
          city: row['Città'],
          stateProvince: row['Provincia'],
          postalCode: row['CAP (Opzionale)'] || null,
          country: row['Nazione'],
          latitude: parseFloat(row['Latitude']),
          longitude: parseFloat(row['Longitude']),
          isactive: true,
        }).select().single();
        if (addressError) {
          toast({ variant: 'destructive', title: 'Errore inserimento indirizzo', description: `Riga ${i+2}: ${addressError.message}` });
          return;
        }
        // 2. Insert company
        const { data: company, error: companyError } = await supabase.from('companies').insert({
          name: row['Nome Azienda'],
          codeVAT: row['Partita IVA'],
          isSupplier: ['sì','si','yes','true','1'].includes(String(row['È Fornitore (Sì/No)']).toLowerCase()),
          isSeller: ['sì','si','yes','true','1'].includes(String(row['È Venditore (Sì/No)']).toLowerCase()),
          addressId: address.id,
          categoryId: row['ID Categoria'],
          isActive: true,
        }).select().single();
        if (companyError) {
          toast({ variant: 'destructive', title: 'Errore inserimento azienda', description: `Riga ${i+2}: ${companyError.message}` });
          return;
        }
        insertedCompanies.push(company);
      }
      toast({ title: 'Successo!', description: `${insertedCompanies.length} aziende caricate con successo.` });
      setIsBulkUploadOpen(false);
      // Optionally, refresh the companies list here
    } catch (error: any) {
      console.error('Errore durante il bulk upload:', error);
      toast({ variant: 'destructive', title: 'Errore Critico', description: error.message || 'Impossibile completare l\'operazione.' });
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
            isLoading={isLoadingCategories}
          />
        )}
      </div>
    </Layout>
  );
};

export default Companies; 