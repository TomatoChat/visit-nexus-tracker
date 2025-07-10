import React, { useState, useEffect, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import ActivityManagement from '@/components/data-management/ActivityManagement';
import BulkUploadDialog from '@/components/data-management/BulkUploadDialog';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAndDownloadXlsxTemplate, parseXlsxFile } from '@/lib/xlsx-utils';
import { mockBulkUploadActivities } from '@/lib/mock-bulk-api'; // Import mock API

const ACTIVITY_TEMPLATE_HEADERS = [
  'Nome Attività', // name
];

const Activities = () => {
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
  const handleDownloadTemplate = useCallback(() => {
    generateAndDownloadXlsxTemplate(ACTIVITY_TEMPLATE_HEADERS, 'Activities');
    toast({ title: 'Template Downloaded', description: 'Il file template_activities.xlsx è stato scaricato.' });
  }, [toast]);

  const handleFileUpload = useCallback(async (file: File) => {
    toast({ title: 'Elaborazione file...', description: 'Lettura e validazione del file XLSX caricato per Attività.' });

    try {
      const rows = await parseXlsxFile<any>(file);

      if (!rows || rows.length === 0) {
        toast({ variant: 'destructive', title: 'Errore di Validazione', description: 'Il file caricato è vuoto o non contiene righe di dati.' });
        return;
      }

      // Client-side validation for Activities
      const requiredActivityHeaders = ['Nome Attività'];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const userRowIndex = i + 2; // Excel row number

        for (const header of requiredActivityHeaders) {
          if (row[header] === undefined || row[header] === null || String(row[header]).trim() === '') {
            toast({ variant: 'destructive', title: 'Errore di Validazione', description: `Errore nella riga ${userRowIndex}: Il campo "${header}" è mancante o vuoto.` });
            return;
          }
        }
      }

      toast({ title: 'Validazione OK', description: `${rows.length} righe analizzate per Attività. Inizio caricamento simulato...` });

      const apiResponse = await mockBulkUploadActivities(rows);

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
          console.error('API Errors (Activities):', apiResponse.errors);
        } else {
          toast({
            variant: 'destructive',
            title: 'Caricamento Fallito',
            description: errorMessage,
          });
        }
      }

    } catch (error: any) {
      console.error("Errore durante l'elaborazione del file XLSX o chiamata API (Attività):", error);
      toast({ variant: 'destructive', title: 'Errore Critico', description: error.message || 'Impossibile completare l\'operazione.' });
    }
  }, [toast, setIsBulkUploadOpen]);

  // Show loading state while determining user role
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
            <h1 className="text-lg font-bold text-gray-800">Attività</h1>
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
                className="border-black text-black hover:bg-gray-50"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Attività"
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
                aria-label="Caricamento Massivo Attività"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        {/* Desktop: Title and actions */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-left">Attività</h1>
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
                placeholder="Cerca attività..."
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
                className="border-black text-black hover:bg-gray-50"
                onClick={() => setTriggerAddForm(true)}
                aria-label="Aggiungi Attività"
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
                aria-label="Caricamento Massivo Attività"
              >
                <UploadCloud className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        <ActivityManagement
          readOnly={userRole === 'internalAgent'}
          searchTerm={searchTerm}
          triggerAddForm={triggerAddForm}
          onAddFormShown={() => setTriggerAddForm(false)}
        />
        {canManage && (
          <BulkUploadDialog
            entityName="Attività" // Consistent name
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

export default Activities; 