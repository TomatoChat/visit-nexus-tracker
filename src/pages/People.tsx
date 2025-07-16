import React, { useState, useEffect, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import PersonManagement from '@/components/data-management/PersonManagement';
import BulkUploadDialog from '@/components/data-management/BulkUploadDialog';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAndDownloadXlsxTemplate, parseXlsxFile, parseCsvFile } from '@/lib/xlsx-utils';
import { mockBulkUploadPeople } from '@/lib/mock-bulk-api'; // Import mock API
import { supabase } from '@/integrations/supabase/client';

const PEOPLE_TEMPLATE_HEADERS = [
  'Nome', // name
  'Cognome', // surname
  'Email', // email
  'Telefono', // phoneNumber
  'ID Azienda', // selectedCompanyId
  'ID Punto Vendita (Opzionale)', // selectedSellingPointId
  'ID Ruolo Persona', // selectedRoleId
];

const People = () => {
  const { userRole, loading, checkCanManageData } = useRoles();
  const { toast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [triggerAddForm, setTriggerAddForm] = useState(false);
  const [canManage, setCanManage] = useState(false); // State for RBAC
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
  const handleDownloadTemplate = useCallback(async () => {
    // Fetch latest companies, person roles, and selling points for the reference tabs
    const { data: freshCompanies } = await supabase.from('companies').select('id, name').eq('isActive', true).order('name', { ascending: true });
    const { data: freshRoles } = await supabase.from('personRoles').select('id, name').eq('isactive', true).order('name', { ascending: true });
    const { data: freshSellingPoints } = await supabase.from('sellingPoints').select('id, name').eq('isactive', true).order('name', { ascending: true });
    const companiesList = freshCompanies || [];
    const rolesList = freshRoles || [];
    const sellingPointsList = freshSellingPoints || [];
    const referenceData = {
      'Aziende': [
        ['ID Azienda', 'Nome Azienda'],
        ...companiesList.map(c => [c.id, c.name])
      ],
      'Ruoli Persona': [
        ['ID Ruolo', 'Nome Ruolo'],
        ...rolesList.map(r => [r.id, r.name])
      ],
      'Punti Vendita': [
        ['ID Punto Vendita', 'Nome Punto Vendita'],
        ...sellingPointsList.map(sp => [sp.id, sp.name])
      ]
    };
    generateAndDownloadXlsxTemplate(PEOPLE_TEMPLATE_HEADERS, 'People', 'Data', referenceData);
    toast({ title: 'Template Downloaded', description: 'Il file template_people.xlsx è stato scaricato.' });
  }, [toast]);

  const handleFileUpload = useCallback(async (file: File) => {
    toast({ title: 'Elaborazione file...', description: 'Lettura e validazione del file caricato per Persone.' });
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

      // Client-side validation for People
      const requiredPersonHeaders = ['Nome', 'Cognome', 'Email', 'Telefono', 'ID Azienda', 'ID Ruolo Persona'];
      // Regex for basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const userRowIndex = i + 2; // Excel row number

        for (const header of requiredPersonHeaders) {
          if (row[header] === undefined || row[header] === null || String(row[header]).trim() === '') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "${header}" è mancante o vuoto.` });
            return;
          }
        }

        // Validate Email format
        const emailValue = String(row['Email']).trim();
        if (!emailRegex.test(emailValue)) {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "Email" non è un indirizzo email valido. Trovato: "${emailValue}".` });
            return;
        }
      }

      toast({ title: 'Validazione OK', description: `${rows.length} righe analizzate per Persone. Inizio caricamento...` });

      const apiResponse = await mockBulkUploadPeople(rows);

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
          console.error('API Errors (People):', apiResponse.errors);
        } else {
          toast({
            variant: 'destructive',
            title: 'Caricamento Fallito',
            description: errorMessage,
          });
        }
      }

    } catch (error: any) {
      console.error("Errore durante l'elaborazione del file XLSX o chiamata API (Persone):", error);
      toast({ variant: 'destructive', title: 'Errore Critico', description: error.message || 'Impossibile completare l\'operazione.' });
    }
  }, [toast, setIsBulkUploadOpen]);

  // Show loading state while determining user role
  if (loading) {
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

  return (
    <Layout>
      <div className="w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button, title, and actions */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold">Persone</h1>
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
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-border text-foreground hover:bg-muted/50"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Persona"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="border-border text-foreground hover:bg-muted/50"
                onClick={() => setIsBulkUploadOpen(true)}
                aria-label="Caricamento Massivo Persone"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        {/* Desktop: Title and actions */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-left">Persone</h1>
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
                placeholder="Cerca persone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            {!userRole?.includes('internalAgent') && (
              <Button
                variant="ghost"
                size="icon"
                className="border-border text-foreground hover:bg-muted/50"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Persona"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="border-border text-foreground hover:bg-muted/50"
                onClick={() => setIsBulkUploadOpen(true)}
                aria-label="Caricamento Massivo Persone"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        <PersonManagement
          readOnly={userRole === 'internalAgent'}
          searchTerm={searchTerm}
          triggerAddForm={triggerAddForm}
          onAddFormShown={() => setTriggerAddForm(false)}
        />
        {canManage && (
          <BulkUploadDialog
            entityName="Persone" // Consistent name
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

export default People; 