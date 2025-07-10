import React, { useState, useEffect, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import SellingPointManagement from '@/components/data-management/SellingPointManagement';
import BulkUploadDialog from '@/components/data-management/BulkUploadDialog';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, UploadCloud } from 'lucide-react';
import { useSellers } from '@/hooks/use-data';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { generateAndDownloadXlsxTemplate, parseXlsxFile } from '@/lib/xlsx-utils';
import { mockBulkUploadSellingPoints } from '@/lib/mock-bulk-api'; // Import mock API

const SELLING_POINT_TEMPLATE_HEADERS = [
  'Nome Punto Vendita', // name
  'ID Azienda Venditrice', // selectedSellerCompanyId (user needs to provide existing company ID)
  'Telefono (Opzionale)', // phoneNumber
  'Via', // addressForm.addressLine1
  'Civico', // addressForm.addressLine2
  'Città', // addressForm.city
  'Provincia', // addressForm.stateProvince
  'CAP', // addressForm.postalCode
  'Nazione', // addressForm.country
  'Latitude (Opzionale)', // addressForm.latitude
  'Longitude (Opzionale)', // addressForm.longitude
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
  
  // Fetch seller companies for filter
  const { data: sellers = [], isLoading: isLoadingSellers } = useSellers();

  useEffect(() => {
    const verifyPermissions = async () => {
      const result = await checkCanManageData();
      setCanManage(result);
    };
    if (!loading) { // Ensure roles are loaded before checking
      verifyPermissions();
    }
  }, [loading, checkCanManageData]);

  // Placeholder handlers for the dialog
  const handleDownloadTemplate = useCallback(() => {
    generateAndDownloadXlsxTemplate(SELLING_POINT_TEMPLATE_HEADERS, 'Selling_Points');
    toast({ title: 'Template Downloaded', description: 'Il file template_selling_points.xlsx è stato scaricato.' });
  }, [toast]);

  const handleFileUpload = useCallback(async (file: File) => {
    toast({ title: 'Elaborazione file...', description: 'Lettura e validazione del file XLSX caricato per Punti Vendita.' });

    try {
      const rows = await parseXlsxFile<any>(file);

      if (!rows || rows.length === 0) {
        toast({ variant: 'destructive', title: 'Errore di Validazione', description: 'Il file caricato è vuoto o non contiene righe di dati.' });
        return;
      }

      // Client-side validation for Selling Points
      const requiredSellingPointHeaders = ['Nome Punto Vendita', 'ID Azienda Venditrice'];
      const requiredAddressHeaders = ['Via', 'Città', 'Provincia', 'Nazione']; // New address assumed

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

      toast({ title: 'Validazione OK', description: `${rows.length} righe analizzate per Punti Vendita. Inizio caricamento simulato...` });

      const apiResponse = await mockBulkUploadSellingPoints(rows);

      if (apiResponse.success) {
        toast({ title: 'Successo!', description: apiResponse.message });
        setIsBulkUploadOpen(false);
      } else {
        let errorMessage = apiResponse.message;
        if (apiResponse.errors && apiResponse.errors.length > 0) {
          const firstError = apiResponse.errors[0];
          errorMessage = `Errore principale: ${apiResponse.message}. Primo errore dettaglio: Riga ${firstError.row}: ${firstError.error}`;
          toast({
            variant: 'destructive',
            title: 'Caricamento Fallito',
            description: errorMessage,
            duration: 10000,
          });
          console.error('API Errors (Selling Points):', apiResponse.errors);
        } else {
          toast({
            variant: 'destructive',
            title: 'Caricamento Fallito',
            description: errorMessage,
          });
        }
      }

    } catch (error: any) {
      console.error("Errore durante l'elaborazione del file XLSX o chiamata API (Punti Vendita):", error);
      toast({ variant: 'destructive', title: 'Errore Critico', description: error.message || 'Impossibile completare l\'operazione.' });
    }
  }, [toast, setIsBulkUploadOpen]);

  // Show loading state while determining user role or sellers
  if (loading || isLoadingSellers) {
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

  // Prepare filter options
  const filterOptions = sellers.map(seller => ({
    value: seller.id,
    label: seller.name
  }));

  return (
    <Layout>
      <div className="min-h-screen w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button, title, and actions */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-gray-800">Punti Vendita</h1>
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
              aria-label="Filtra per azienda venditrice"
              onClick={() => setShowFilter(!showFilter)}
              className={showFilter ? "bg-blue-50 text-blue-600" : ""}
            >
              <Filter className="w-5 h-5" />
            </Button>
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50"
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
                className="border-black text-black hover:bg-gray-50"
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
          <h1 className="text-3xl font-bold text-gray-800 text-left">Punti Vendita</h1>
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
              aria-label="Filtra per azienda venditrice"
              onClick={() => setShowFilter(!showFilter)}
              className={showFilter ? "bg-blue-50 text-blue-600" : ""}
            >
              <Filter className="w-5 h-5" />
            </Button>
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50"
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
                className="border-black text-black hover:bg-gray-50"
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
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filtra per azienda venditrice</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSellerFilters([])}
                className="text-xs"
              >
                Deseleziona tutto
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filterOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSellerFilters.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSellerFilters(prev => [...prev, option.value]);
                      } else {
                        setSelectedSellerFilters(prev => prev.filter(id => id !== option.value));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {selectedSellerFilters.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-xs text-gray-500">
                  {selectedSellerFilters.length} azienda{selectedSellerFilters.length !== 1 ? 'e' : ''} selezionata{selectedSellerFilters.length !== 1 ? 'e' : ''}
                </span>
              </div>
            )}
          </div>
        )}
        
        <SellingPointManagement 
          readOnly={userRole === 'internalAgent'} 
          searchTerm={searchTerm} 
          sellerFilters={selectedSellerFilters}
          triggerAddForm={triggerAddForm}
          onAddFormShown={() => setTriggerAddForm(false)}
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