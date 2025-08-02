import React, { useState, useEffect, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import SellingPointManagement from '@/components/data-management/SellingPointManagement';
import BulkUploadDialog from '@/components/data-management/BulkUploadDialog';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, UploadCloud } from 'lucide-react';
import { useSellers, useAllUsers } from '@/hooks/use-data';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { generateAndDownloadXlsxTemplate, parseXlsxFile, parseCsvFile } from '@/lib/xlsx-utils';
import { supabase } from '@/integrations/supabase/client';

const SELLING_POINT_TEMPLATE_HEADERS = [
  'Nome Punto Vendita', // name
  'ID Azienda Cliente', // selectedSellerCompanyId (user needs to provide existing company ID)
  'Telefono (Opzionale)', // phoneNumber
  'Via', // addressForm.addressLine1
  'Civico (Opzionale)', // addressForm.addressLine2
  'Città', // addressForm.city
  'Provincia', // addressForm.stateProvince
  'CAP (Opzionale)', // addressForm.postalCode
  'Nazione', // addressForm.country
  'Latitude', // addressForm.latitude (Required in database)
  'Longitude', // addressForm.longitude (Required in database)
  'ID Fornitore 1',
  'ID Fornitore 2',
  'ID Fornitore 3',
  'ID Fornitore 4',
];

const SellingPoints = () => {
  const { userRole, loading, checkCanManageData } = useRoles();
  const { toast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [triggerAddForm, setTriggerAddForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSellerFilters, setSelectedSellerFilters] = useState<string[]>([]);
  const [canManage, setCanManage] = useState(false); // State for RBAC
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false); // State for dialog
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showAccountManagerDropdown, setShowAccountManagerDropdown] = useState(false);
  
  // Fetch seller companies for filter
  const { data: sellers = [], isLoading: isLoadingSellers } = useSellers();
  const { data: users = [], isLoading: isLoadingUsers } = useAllUsers();
  const [selectedAccountManager, setSelectedAccountManager] = useState<string | null>(null);

  useEffect(() => {
    const verifyPermissions = async () => {
      const result = await checkCanManageData();
      setCanManage(result);
    };
    if (!loading) { // Ensure roles are loaded before checking
      verifyPermissions();
    }
  }, [loading, checkCanManageData]);

  useEffect(() => {
    if (showFilter) {
      setShowCompanyDropdown(true);
      setShowAccountManagerDropdown(true);
    }
  }, [showFilter]);

  // Placeholder handlers for the dialog
  const handleDownloadTemplate = useCallback(async () => {
    // Fetch latest sellers and suppliers for the reference tabs
    const { data: freshSellers } = await supabase.from('companies').select('id, name').eq('isSeller', true).eq('isActive', true).order('name', { ascending: true });
    const { data: freshSuppliers } = await supabase.from('companies').select('id, name').eq('isSupplier', true).eq('isActive', true).order('name', { ascending: true });
    const sellersList = freshSellers || sellers || [];
    const suppliersList = freshSuppliers || [];
    const referenceData = {
      'Aziende Venditrici': [
        ['ID Azienda', 'Nome Azienda'],
        ...sellersList.map(s => [s.id, s.name])
      ],
      'Aziende Fornitrici': [
        ['ID Azienda', 'Nome Azienda'],
        ...suppliersList.map(s => [s.id, s.name])
      ]
    };
    generateAndDownloadXlsxTemplate(SELLING_POINT_TEMPLATE_HEADERS, 'Selling_Points', 'Data', referenceData);
    toast({ title: 'Template Downloaded', description: 'Il file template_selling_points.xlsx è stato scaricato.' });
  }, [toast, sellers]);

  const handleFileUpload = useCallback(async (file: File) => {
    toast({ title: 'Elaborazione file...', description: 'Lettura e validazione del file caricato per Punti Vendita.' });
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

      // Client-side validation for Selling Points
      const requiredSellingPointHeaders = ['Nome Punto Vendita', 'ID Azienda Cliente'];
      const requiredAddressHeaders = ['Via', 'Città', 'Provincia', 'Nazione', 'Latitude', 'Longitude']; // New address assumed

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const userRowIndex = i + 2; // Excel row number

        for (const header of requiredSellingPointHeaders) {
          if (row[header] === undefined || row[header] === null || String(row[header]).trim() === '') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "${header}" è mancante o vuoto.` });
            return;
          }
        }

        for (const header of requiredAddressHeaders) {
          if (row[header] === undefined || row[header] === null || String(row[header]).trim() === '') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo indirizzo "${header}" è mancante o vuoto.` });
            return;
          }
        }
      }

      toast({ title: 'Validazione OK', description: `${rows.length} righe analizzate per Punti Vendita. Inizio caricamento...` });

      // --- REAL BULK UPLOAD LOGIC ---
      // All-or-nothing: if any insert fails, abort and show error
      let insertedSellingPoints = [];
      let insertedLinks = 0;
      const today = new Date().toISOString().split('T')[0];
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
        // 2. Insert selling point
        const { data: sellingPoint, error: sellingPointError } = await supabase.from('sellingPoints').insert({
          name: row['Nome Punto Vendita'],
          phoneNumber: row['Telefono (Opzionale)'] || null,
          sellerCompanyId: row['ID Azienda Cliente'],
          addressId: address.id,
          isactive: true,
        }).select().single();
        if (sellingPointError) {
          toast({ variant: 'destructive', title: 'Errore inserimento punto vendita', description: `Riga ${i+2}: ${sellingPointError.message}` });
          return;
        }
        insertedSellingPoints.push(sellingPoint);
        // 3. Insert up to 4 supplier links
        for (let j = 1; j <= 4; j++) {
          const supplierId = row[`ID Fornitore ${j}`];
          if (supplierId && String(supplierId).trim() !== '') {
            const { error: linkError } = await supabase.from('companySellingPoint').insert({
              supplierCompanyId: supplierId,
              sellingPointId: sellingPoint.id,
              startDate: today,
              isactive: true,
            });
            if (linkError) {
              toast({ variant: 'destructive', title: 'Errore collegamento fornitore', description: `Riga ${i+2}, Fornitore ${j}: ${linkError.message}` });
              return;
            }
            insertedLinks++;
          }
        }
      }
      toast({ title: 'Successo!', description: `${insertedSellingPoints.length} punti vendita e ${insertedLinks} collegamenti fornitore caricati con successo.` });
      setIsBulkUploadOpen(false);
      // Optionally, refresh the selling points list here
    } catch (error: any) {
      console.error('Errore durante il bulk upload:', error);
      toast({ variant: 'destructive', title: 'Errore Critico', description: error.message || 'Impossibile completare l\'operazione.' });
    }
  }, [toast, setIsBulkUploadOpen]);

  // Multi-select handler for companies
  const handleCompanyMultiSelect = (selected) => {
    // selected can be a string (single) or array (multi)
    if (Array.isArray(selected)) {
      setSelectedSellerFilters(selected);
    } else if (selected) {
      setSelectedSellerFilters([selected]);
    } else {
      setSelectedSellerFilters([]);
    }
  };

  // Show loading state while determining user role or sellers
  if (loading || isLoadingSellers || isLoadingUsers) {
    return (
      <Layout>
        <div className="w-full pb-2 md:p-8">
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
        <div className="w-full pb-2 md:p-8">
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
        <div className="w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-red-600">Access Denied</div>
          </div>
        </div>
      </Layout>
    );
  }

  // Prepare filter options
  const filterOptions = sellers.map(seller => ({
    value: seller.id,
    label: seller.name
  }));

  return (
    <Layout>
      <div className="w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button, title, and actions */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold">Punti Vendita</h1>
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="Filtra per azienda cliente"
              onClick={() => setShowFilter(!showFilter)}
              className={showFilter ? "bg-info/10 text-info" : ""}
            >
              <Filter className="w-5 h-5" />
            </Button>
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Punto Vendita"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setIsBulkUploadOpen(true)}
                aria-label="Caricamento Massivo Punti Vendita"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        {/* Desktop: Title and actions */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-left">Gestione Punti Vendita</h1>
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
                placeholder="Cerca punti vendita..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Filtra per azienda cliente"
              onClick={() => setShowFilter(!showFilter)}
              className={showFilter ? "bg-info/10 text-info" : ""}
            >
              <Filter className="w-5 h-5" />
            </Button>
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-border text-foreground hover:bg-accent"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Punto Vendita"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="border-border text-foreground hover:bg-accent"
                onClick={() => setIsBulkUploadOpen(true)}
                aria-label="Caricamento Massivo Punti Vendita"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        {showFilter && (
          <div className="mb-4 p-4 bg-muted rounded-lg border">
            {/* Azienda Cliente Multi-Select */}
            <div className="mb-3">
              <label className="flex items-center gap-2 text-sm font-medium mb-1">
                <Filter className="w-4 h-4" />
                Filtra per azienda cliente
              </label>
              {showCompanyDropdown && (
                <SearchableSelect
                  options={filterOptions}
                  value={selectedSellerFilters}
                  onSelect={handleCompanyMultiSelect}
                  placeholder="Seleziona una o più aziende"
                  searchPlaceholder="Cerca azienda..."
                  isMulti
                />
              )}
            </div>
            {/* Responsabile Cliente Filter */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Filtra per Responsabile Cliente</label>
              {showAccountManagerDropdown && (
                <SearchableSelect
                  options={[{ value: '', label: 'Tutti gli utenti' }, ...users.map(u => ({ value: u.id, label: u.displayName }))]}
                  value={selectedAccountManager || ''}
                  onSelect={val => typeof val === 'string' ? setSelectedAccountManager(val) : setSelectedAccountManager(val[0] || null)}
                  placeholder={isLoadingUsers ? 'Caricamento utenti...' : 'Seleziona responsabile'}
                  searchPlaceholder="Cerca responsabile..."
                  disabled={isLoadingUsers}
                />
              )}
            </div>
          </div>
        )}
        
        <SellingPointManagement 
          readOnly={userRole === 'internalAgent'} 
          searchTerm={searchTerm} 
          sellerFilters={selectedSellerFilters}
          triggerAddForm={triggerAddForm}
          onAddFormShown={() => setTriggerAddForm(false)}
          accountManagerFilter={selectedAccountManager}
        />
        {canManage && (
          <BulkUploadDialog
            entityName="Punti Vendita" // Consistent name
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

export default SellingPoints; 