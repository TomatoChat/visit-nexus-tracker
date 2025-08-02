import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Users, Activity, User, CalendarIcon, Power, ShoppingCart, FileText } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { formatDateForDisplay } from '@/lib/date-utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { PhotoUpload, PhotoUploadRef } from './PhotoUpload';
import { 
  useAccountManagerSellingPoints,
  getSellerCompanyIdsFromSellingPoints,
  getSellingPointIds,
  getSupplierCompanyIdsFromCompanySellingPoints,
  useActivities, 
  usePeopleByCompanies,
  useCreateVisit,
  useUploadPhotos,
  useSuppliers,
  useSellers,
  useSellingPoints,
  useFilteredSellingPoints,
  useFilteredSellersBySupplier,
  useOrdersBySellingPoint
} from '@/hooks/use-data';
import { formatDateForDatabase } from '@/lib/date-utils';
import { useQuery } from '@tanstack/react-query';
import { useRoles } from '@/hooks/use-roles';
import { useAdminMode } from '@/hooks/use-admin-mode';

type Company = Database['public']['Tables']['companies']['Row'];
type SellingPointWithAddress = Database['public']['Tables']['sellingPoints']['Row'] & { addresses?: Database['public']['Tables']['addresses']['Row'] };
type VisitActivity = Database['public']['Tables']['visitActivities']['Row'];
type Person = Database['public']['Tables']['people']['Row'];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface NewVisitFormProps {
  // Empty interface for future props
}

type TabType = 'visit' | 'order';

export const NewVisitForm: React.FC<NewVisitFormProps> = () => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [placedOrder, setPlacedOrder] = useState<boolean | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('visit');
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultDialogContent, setResultDialogContent] = useState<string>('');

  // Person selection state (hidden)
  const [visitedPerson, setVisitedPerson] = useState(false);
  const [personVisitedId, setPersonVisitedId] = useState<string | null>(null);

  // Add state for photos
  const [photos, setPhotos] = useState<{ id: string; file: File; preview: string; uploaded: boolean }[]>([]);
  const photoUploadRef = useRef<PhotoUploadRef>(null);
  
  // Add state for hours spent
  const [hoursSpent, setHoursSpent] = useState<string>('');
  
  // Role checking
  const { userRole, loading: roleLoading } = useRoles();
  const { isAdminMode } = useAdminMode();
  const isAdmin = userRole === 'admin';
  const shouldUseAdminMode = isAdmin && isAdminMode;
  
  // Data fetching hooks - different logic for admin vs regular users
  const { data: amSellingPoints = [], isLoading: isLoadingSellingPoints } = useAccountManagerSellingPoints(user?.id || '');

  // For admins in admin mode, use all selling points; for regular users, use filtered ones
  const { data: allSellingPoints = [], isLoading: isLoadingAllSellingPoints } = useSellingPoints();
  
  // Use filtered selling points when supplier and seller are selected (for both admin and regular users)
  const { data: filteredSellingPoints = [], isLoading: isLoadingFilteredSellingPoints } = useFilteredSellingPoints(
    user?.id || '', 
    selectedSupplierId, 
    selectedSellerId,
    shouldUseAdminMode
  );

  // Get orders for the selected selling point
  const { data: orders = [], isLoading: isLoadingOrders } = useOrdersBySellingPoint(selectedSellingPointId);
  
  // Determine which selling points to use based on selection state
  let sellingPoints: SellingPointWithAddress[] = [];
  let isLoadingSellingPointsData = false;
  
  if (selectedSupplierId && selectedSellerId) {
    // When both supplier and seller are selected, use filtered selling points for both admin and regular users
    sellingPoints = filteredSellingPoints;
    isLoadingSellingPointsData = isLoadingFilteredSellingPoints;
  } else {
    // When supplier or seller not selected, use account manager selling points (for regular users) or all selling points (for admin mode)
    sellingPoints = shouldUseAdminMode ? allSellingPoints : amSellingPoints;
    isLoadingSellingPointsData = shouldUseAdminMode ? isLoadingAllSellingPoints : isLoadingSellingPoints;
  }

  // Check if user has any assigned selling points (only relevant for non-admin users or admins in user mode)
  const hasAssignedSellingPoints = shouldUseAdminMode ? true : amSellingPoints.length > 0;

  // For admins in admin mode, use all suppliers and sellers; for regular users, use filtered ones
  const { data: allSuppliers = [], isLoading: isLoadingAllSuppliers } = useSuppliers();
  const { data: allSellers = [], isLoading: isLoadingAllSellers } = useSellers();

  // Sellers - different logic for admin vs regular users
  const sellerCompanyIds = shouldUseAdminMode ? [] : getSellerCompanyIdsFromSellingPoints(amSellingPoints);
  const { data: amSellers = [], isLoading: isLoadingSellers } = useQuery({
    queryKey: ['accountManagerSellers', sellerCompanyIds],
    queryFn: async () => {
      if (sellerCompanyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', sellerCompanyIds)
        .eq('isSeller', true)
        .eq('isActive', true);
      if (error) throw error;
      return data || [];
    },
    enabled: sellerCompanyIds.length > 0 && !shouldUseAdminMode,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // New: Filtered sellers by supplier
  const { data: filteredSellers = [], isLoading: isLoadingFilteredSellers } = useFilteredSellersBySupplier(selectedSupplierId);

  // Seller options logic
  let sellerOptions: { value: string; label: string }[] = [];
  let isLoadingSellerOptions = false;
  if (selectedSupplierId) {
    sellerOptions = filteredSellers
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(seller => ({ value: seller.id, label: seller.name }));
    isLoadingSellerOptions = isLoadingFilteredSellers;
  } else {
    sellerOptions = (shouldUseAdminMode ? allSellers : amSellers)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(seller => ({ value: seller.id, label: seller.name }));
    isLoadingSellerOptions = shouldUseAdminMode ? isLoadingAllSellers : isLoadingSellers;
  }

  // Selling point options
  const sellingPointOptions = sellingPoints
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(point => ({
      value: point.id,
      label: point.name,
      subtitle: point.addresses?.city || ''
    }));

  // Suppliers - different logic for admin vs regular users
  const sellingPointIds = shouldUseAdminMode ? [] : getSellingPointIds(amSellingPoints);
  const { data: companySellingPoints = [], isLoading: isLoadingCompanySellingPoints } = useQuery({
    queryKey: ['accountManagerCompanySellingPoints', sellingPointIds],
    queryFn: async () => {
      if (sellingPointIds.length === 0) return [];
      const { data, error } = await supabase
        .from('companySellingPoint')
        .select('supplierCompanyId')
        .in('sellingPointId', sellingPointIds)
        .eq('isactive', true);
      if (error) throw error;
      return data || [];
    },
    enabled: sellingPointIds.length > 0 && !shouldUseAdminMode,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  const supplierCompanyIds = shouldUseAdminMode ? [] : getSupplierCompanyIdsFromCompanySellingPoints(companySellingPoints);
  const { data: amSuppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['accountManagerSuppliers', supplierCompanyIds],
    queryFn: async () => {
      if (supplierCompanyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', supplierCompanyIds)
        .eq('isSupplier', true)
        .eq('isActive', true);
      if (error) throw error;
      return data || [];
    },
    enabled: supplierCompanyIds.length > 0 && !shouldUseAdminMode,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useActivities();
  const { data: people = [], isLoading: isLoadingPeople } = usePeopleByCompanies([selectedSupplierId, selectedSellerId].filter(Boolean));
  
  // Activity options
  const activityOptions = activities
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(activity => ({
      value: activity.id,
      label: activity.name,
      subtitle: undefined
    }));
  
  // Mutations
  const createVisitMutation = useCreateVisit();
  const uploadPhotosMutation = useUploadPhotos();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser({ id: data.user.id, email: data.user.email ?? '' });
    }
  };

  // Load sellers when supplier is selected
  useEffect(() => {
    if (selectedSupplierId) {
      // Reset subsequent selections
      setSelectedSellerId('');
      setSelectedSellingPointId('');
      setSelectedActivityId('');
    }
  }, [selectedSupplierId]);

  // Load selling points when seller is selected
  useEffect(() => {
    if (selectedSellerId && selectedSupplierId) {
      // Reset subsequent selections
      setSelectedSellingPointId('');
      setSelectedActivityId('');
    }
  }, [selectedSellerId, selectedSupplierId]);

  // Load activities when selling point is selected
  useEffect(() => {
    if (selectedSellingPointId) {
      // Reset subsequent selections
      setSelectedActivityId('');
    }
  }, [selectedSellingPointId]);

  // Set default for placedOrder to false when an activity is selected
  useEffect(() => {
    if (selectedActivityId) {
      setPlacedOrder(false);
      setVisitedPerson(false);
      setPersonVisitedId(null);
    }
  }, [selectedActivityId]);

  // Use different data sources based on admin mode status
  const supplierOptions = (shouldUseAdminMode ? allSuppliers : amSuppliers)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(supplier => ({
      value: supplier.id,
      label: supplier.name
    }));

  const selectedSupplier = (shouldUseAdminMode ? allSuppliers : amSuppliers).find(s => s.id === selectedSupplierId);
  const selectedSeller = (shouldUseAdminMode ? allSellers : amSellers).find(s => s.id === selectedSellerId);
  const selectedSellingPoint = sellingPoints.find(p => p.id === selectedSellingPointId);
  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  const canSubmit = user && selectedSupplierId && selectedSellerId && selectedSellingPointId && selectedActivityId && placedOrder !== null;

  const handleSubmitVisit = async () => {
    if (!canSubmit) return;
    setLoading(prev => ({ ...prev, submitting: true }));
    
    try {
      let orderId = selectedOrderId;
      
      // If placedOrder is true and no order is selected, create a new order
      if (placedOrder && !selectedOrderId) {
        try {
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
              supplierCompanyId: selectedSupplierId,
              sellingPointId: selectedSellingPointId,
              orderDate: formatDateForDatabase(selectedDate),
              notes: `Ordine creato da visita - ${selectedActivity?.name || 'Attività'}`,
              userId: user!.id,
            })
            .select()
            .single();

          if (orderError) throw orderError;
          orderId = orderData.id;
        } catch (orderError) {
          console.error("Error creating order:", orderError);
          // Continue with visit creation even if order creation fails
        }
      }

      const visitData = {
        supplierCompanyId: selectedSupplierId,
        sellingPointId: selectedSellingPointId,
        activityId: selectedActivityId,
        agentId: user!.id,
        visitDate: formatDateForDatabase(selectedDate),
        personVisitedId: visitedPerson ? personVisitedId : null,
        hoursSpend: hoursSpent ? parseInt(hoursSpent, 10) : null,
        orderId: orderId,
      };

      const result = await createVisitMutation.mutateAsync(visitData);

      // Upload photos if any
      if (photos.length > 0 && result) {
        console.log('Attempting to upload photos for visit:', result.id);
        try {
          const photoFiles = photos.map(p => p.file);
          await uploadPhotosMutation.mutateAsync({ visitId: result.id, photos: photoFiles });
        } catch (photoError) {
          console.error('Error uploading photos:', photoError);
          // Don't fail the entire submission if photos fail to upload
        }
      } else {
        console.log('No photos to upload or no visit data');
      }

      setResultDialogContent('Visita registrata correttamente!');
      setShowResultDialog(true);
      // Reset form after successful submission
      resetForm();
    } catch (error) {
      console.error('Error submitting visit:', error);
      setResultDialogContent('Errore nell\'invio della visita. Per favore riprova più tardi.');
      setShowResultDialog(true);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleSubmitOrder = async () => {
    if (!user || !selectedSupplierId || !selectedSellerId || !selectedSellingPointId || !orderDate) {
      setResultDialogContent('Compila tutti i campi obbligatori per creare l\'ordine.');
      setShowResultDialog(true);
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));
    
    try {
      const { error } = await supabase
        .from("orders")
        .insert({
          supplierCompanyId: selectedSupplierId,
          sellingPointId: selectedSellingPointId,
          orderDate: formatDateForDatabase(orderDate),
          notes: notes.trim() || null,
          userId: user.id,
        });

      if (error) throw error;

      setResultDialogContent('Ordine creato con successo!');
      setShowResultDialog(true);
      // Reset form after successful submission
      resetForm();
    } catch (error) {
      console.error('Error submitting order:', error);
      setResultDialogContent('Errore nell\'invio dell\'ordine. Per favore riprova più tardi.');
      setShowResultDialog(true);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setSelectedSellerId('');
    setSelectedSellingPointId('');
    setSelectedActivityId('');
    setSelectedDate(new Date());
    setOrderDate(undefined);
    setPlacedOrder(null);
    setSelectedOrderId(null);
    setPhotos([]);
    setHoursSpent('');
    setNotes("");
  };

  const handleLogout = async () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Add person options
  const personOptions = people
    .slice()
    .sort((a, b) => a.surname.localeCompare(b.surname))
    .map(person => ({
      value: person.id,
      label: `${person.name} ${person.surname}`
    }));

  // Show loading state while role is being determined
  if (roleLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Caricamento...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vuoi uscire?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Sì</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Submission Result Dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Risultato</AlertDialogTitle>
            <AlertDialogDescription>{resultDialogContent}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowResultDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card className="w-full">
        <CardContent className="p-6">
          {/* Admin mode notice */}
          {shouldUseAdminMode && (
            <div className="p-4 bg-info/10 border border-info/20 rounded-lg mb-6">
              <p className="text-blue-800">
                <strong>Modalità Amministratore:</strong> Puoi vedere tutti i fornitori, clienti e punti vendita nel sistema.
              </p>
            </div>
          )}
          
          {/* Check if user has assigned selling points (only for non-admin users or admins in user mode) */}
          {!shouldUseAdminMode && !isLoadingSellingPoints && !hasAssignedSellingPoints && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg mb-6">
              <p className="text-yellow-800">
                <strong>Attenzione:</strong> Non hai punti vendita assegnati. 
                Contatta l'amministratore per ricevere le assegnazioni necessarie.
              </p>
            </div>
          )}

          {/* Filter buttons */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'visit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('visit')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Nuova Visita
            </Button>
            <Button
              variant={activeTab === 'order' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('order')}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Nuovo Ordine
            </Button>
          </div>

          {/* Content */}
          {activeTab === 'visit' && (
            <div className="space-y-4 md:space-y-6">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Data visita
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? formatDateForDisplay(selectedDate) : <span>Scegli una data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Step 1: Fornitore */}
              <div className="space-y-2 mt-6">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Fornitore
                </label>
                <SearchableSelect
                  options={supplierOptions}
                  value={selectedSupplierId}
                  onSelect={value => {
                    if (typeof value === 'string') setSelectedSupplierId(value);
                  }}
                  placeholder="Scegli un'azienda fornitrice..."
                  searchPlaceholder="Cerca fornitori..."
                  disabled={shouldUseAdminMode ? isLoadingAllSuppliers : (isLoadingSuppliers || !hasAssignedSellingPoints)}
                />
              </div>

              {/* Step 2: Cliente */}
              {selectedSupplierId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cliente
                  </label>
                  <SearchableSelect
                    options={sellerOptions}
                    value={selectedSellerId}
                    onSelect={value => {
                      if (typeof value === 'string') setSelectedSellerId(value);
                    }}
                    placeholder="Scegli un cliente..."
                    searchPlaceholder="Cerca clienti..."
                    disabled={isLoadingSellerOptions}
                  />
                </div>
              )}

              {/* Step 3: Punto Vendita */}
              {selectedSellerId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Punto vendita
                  </label>
                  {selectedSupplierId && selectedSellerId && !isLoadingSellingPointsData && sellingPointOptions.length === 0 && (
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-yellow-800">
                        <strong>Nessun punto vendita disponibile:</strong> {shouldUseAdminMode 
                          ? 'Non ci sono punti vendita che abbiano una relazione con il fornitore e cliente selezionati.'
                          : 'Non ci sono punti vendita assegnati a te che abbiano una relazione con il fornitore e cliente selezionati.'
                        }
                      </p>
                    </div>
                  )}
                  <SearchableSelect
                    options={sellingPointOptions}
                    value={selectedSellingPointId}
                    onSelect={value => {
                      if (typeof value === 'string') {
                        setSelectedSellingPointId(value);
                        setSelectedOrderId(null); // Reset order selection when selling point changes
                      }
                    }}
                    placeholder="Scegli un punto vendita..."
                    searchPlaceholder="Cerca punti vendita..."
                    disabled={isLoadingSellingPointsData}
                  />
                </div>
              )}

              {/* Step 4: Attività */}
              {selectedSellingPointId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Attività
                  </label>
                  <SearchableSelect
                    options={activityOptions}
                    value={selectedActivityId}
                    onSelect={value => {
                      if (typeof value === 'string') setSelectedActivityId(value);
                    }}
                    placeholder="Scegli un'attività..."
                    searchPlaceholder="Cerca attività..."
                    disabled={isLoadingActivities}
                  />
                </div>
              )}

              {/* Person selection section - hidden */}
              {selectedActivityId && (
                <>
                  {/* Order section */}
                  <div className="space-y-2 mt-6">
                    <label className="text-sm font-medium flex items-center gap-2" htmlFor="ordine-completato-switch">
                      Ordine
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={placedOrder === true ? 'default' : 'outline'}
                        onClick={() => setPlacedOrder(true)}
                      >
                        Sì
                      </Button>
                      <Button
                        type="button"
                        variant={placedOrder === false ? 'default' : 'outline'}
                        onClick={() => setPlacedOrder(false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {/* Order Selection - only show if placedOrder is true */}
                  {placedOrder === true && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Seleziona Ordine (opzionale)
                      </label>
                      {isLoadingOrders ? (
                        <div className="text-sm text-muted-foreground">Caricamento ordini...</div>
                      ) : orders.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nessun ordine disponibile per questo punto vendita</div>
                      ) : (
                        <SearchableSelect
                          options={orders.map(order => ({
                            value: order.id,
                            label: `${order.supplierCompany?.name || 'N/A'} - ${format(new Date(order.orderDate), 'dd/MM/yyyy')}${order.notes ? ` - ${order.notes}` : ''}`
                          }))}
                          value={selectedOrderId || ''}
                          onSelect={value => {
                            if (typeof value === 'string') setSelectedOrderId(value || null);
                          }}
                          placeholder="Seleziona un ordine esistente..."
                          searchPlaceholder="Cerca ordini..."
                        />
                      )}
                      <div className="text-sm text-muted-foreground">
                        Se non selezioni un ordine esistente, ne verrà creato uno nuovo automaticamente.
                      </div>
                    </div>
                  )}
                  
                  {/* Hours Spent section */}
                  <div className="space-y-2 mt-6">
                    <label className="text-sm font-medium flex items-center gap-2" htmlFor="hours-spent-input">
                      Ore trascorse (opzionale)
                    </label>
                    <input
                      id="hours-spent-input"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                      placeholder="Quante ore hai trascorso?"
                      value={hoursSpent}
                      onChange={e => setHoursSpent(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={loading.submitting}
                    />
                  </div>
                  
                  {/* Photo Upload Section */}
                  <PhotoUpload
                    ref={photoUploadRef}
                    onPhotosChange={setPhotos}
                    disabled={loading.submitting}
                  />

                  {canSubmit && (
                    <div className="space-y-3 p-4 bg-info/10 rounded-lg text-foreground">
                      <h3 className="font-medium text-blue-900">Riepilogo visita</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Email utente:</span> {user?.email}</p>
                        <p><span className="font-medium">Data:</span> {formatDateForDisplay(selectedDate)}</p>
                        <p><span className="font-medium">Fornitore:</span> {selectedSupplier?.name}</p>
                        <p><span className="font-medium">Cliente:</span> {selectedSeller?.name}</p>
                        <p><span className="font-medium">Punto vendita:</span> {selectedSellingPoint?.name}</p>
                        <p><span className="font-medium">Attività:</span> {selectedActivity?.name}</p>
                        <p><span className="font-medium">Ordine:</span> {placedOrder ? 'Sì' : 'No'}</p>
                        {placedOrder && selectedOrderId && (
                          <p><span className="font-medium">Ordine collegato:</span> Sì</p>
                        )}
                        {hoursSpent && (
                          <p><span className="font-medium">Ore trascorse:</span> {hoursSpent}</p>
                        )}
                        {photos.length > 0 && (
                          <p><span className="font-medium">Foto:</span> {photos.length} foto selezionate</p>
                        )}
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={handleSubmitVisit}
                    disabled={!canSubmit || loading.submitting}
                    className="w-full"
                    size="lg"
                  >
                    {loading.submitting ? 'Invio in corso...' : 'Invia rapporto visita'}
                  </Button>
                </>
              )}
            </div>
          )}

          {activeTab === 'order' && (
            <div className="space-y-4 md:space-y-6">
              {/* Step 1: Fornitore */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Fornitore *
                </label>
                <SearchableSelect
                  options={supplierOptions}
                  value={selectedSupplierId}
                  onSelect={value => {
                    if (typeof value === 'string') setSelectedSupplierId(value);
                  }}
                  placeholder="Seleziona un'azienda fornitrice..."
                  searchPlaceholder="Cerca fornitori..."
                  disabled={shouldUseAdminMode ? isLoadingAllSuppliers : (isLoadingSuppliers || !hasAssignedSellingPoints)}
                />
              </div>

              {/* Step 2: Cliente */}
              {selectedSupplierId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cliente *
                  </label>
                  <SearchableSelect
                    options={sellerOptions}
                    value={selectedSellerId}
                    onSelect={value => {
                      if (typeof value === 'string') setSelectedSellerId(value);
                    }}
                    placeholder="Seleziona un cliente..."
                    searchPlaceholder="Cerca clienti..."
                    disabled={isLoadingSellerOptions}
                  />
                </div>
              )}

              {/* Step 3: Punto Vendita */}
              {selectedSellerId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Punto Vendita *
                  </label>
                  <SearchableSelect
                    options={sellingPointOptions}
                    value={selectedSellingPointId}
                    onSelect={value => {
                      if (typeof value === 'string') setSelectedSellingPointId(value);
                    }}
                    placeholder="Seleziona un punto vendita..."
                    searchPlaceholder="Cerca punti vendita..."
                    disabled={isLoadingSellingPointsData}
                  />
                </div>
              )}

              {/* Step 4: Data Ordine */}
              {selectedSellingPointId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Data Ordine *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !orderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderDate ? format(orderDate, "PPP", { locale: it }) : "Seleziona data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={orderDate}
                        onSelect={setOrderDate}
                        initialFocus
                        locale={it}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Step 5: Note */}
              {selectedSellingPointId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Note
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                    placeholder="Inserisci note aggiuntive..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Submit Button */}
              {selectedSellingPointId && (
                <Button 
                  onClick={handleSubmitOrder}
                  disabled={!user || !selectedSupplierId || !selectedSellerId || !selectedSellingPointId || !orderDate || loading.submitting}
                  className="w-full"
                  size="lg"
                >
                  {loading.submitting ? 'Creazione in corso...' : 'Crea Ordine'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
