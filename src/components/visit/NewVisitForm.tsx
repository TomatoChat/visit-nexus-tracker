import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Users, Activity, User, CalendarIcon, Power } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
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
import { AgentOrAbove } from '@/components/ui/role-guard';
import { PhotoUpload, PhotoUploadRef } from './PhotoUpload';
import { 
  useSuppliers, 
  useSellersBySupplier, 
  useSellingPointsBySupplier, 
  useActivities, 
  usePeopleByCompanies,
  useCreateVisit,
  useUploadPhotos
} from '@/hooks/use-data';
import { formatDateForDatabase } from '@/lib/date-utils';

type Company = Database['public']['Tables']['companies']['Row'];
type SellingPointWithAddress = Database['public']['Tables']['sellingPoints']['Row'] & { addresses?: Database['public']['Tables']['addresses']['Row'] };
type VisitActivity = Database['public']['Tables']['visitActivities']['Row'];
type Person = Database['public']['Tables']['people']['Row'];

interface NewVisitFormProps {}

export const NewVisitForm: React.FC<NewVisitFormProps> = () => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [placedOrder, setPlacedOrder] = useState<boolean | null>(null);
  
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultDialogContent, setResultDialogContent] = useState<string>('');

  // Person selection state (hidden)
  const [visitedPerson, setVisitedPerson] = useState(false);
  const [personVisitedId, setPersonVisitedId] = useState<string | null>(null);

  // Add state for photos
  const [photos, setPhotos] = useState<any[]>([]);
  const photoUploadRef = useRef<PhotoUploadRef>(null);
  
  // Add state for hours spent
  const [hoursSpent, setHoursSpent] = useState<string>('');
  
  // Data fetching hooks
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: sellers = [], isLoading: isLoadingSellers } = useSellersBySupplier(selectedSupplierId);
  const { data: sellingPoints = [], isLoading: isLoadingSellingPoints } = useSellingPointsBySupplier(selectedSupplierId, selectedSellerId);
  const { data: activities = [], isLoading: isLoadingActivities } = useActivities();
  const { data: people = [], isLoading: isLoadingPeople } = usePeopleByCompanies([selectedSupplierId, selectedSellerId].filter(Boolean));
  
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

  const supplierOptions = suppliers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(supplier => ({
      value: supplier.id,
      label: supplier.name
    }));

  const sellerOptions = sellers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(seller => ({
      value: seller.id,
      label: seller.name
    }));

  const sellingPointOptions = sellingPoints
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(point => ({
      value: point.id,
      label: point.name,
      subtitle: point.addresses?.city || ''
    }));

  const activityOptions = activities
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(activity => ({
      value: activity.id,
      label: activity.name,
      subtitle: undefined
    }));

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedSeller = sellers.find(s => s.id === selectedSellerId);
  const selectedSellingPoint = sellingPoints.find(p => p.id === selectedSellingPointId);
  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  const canSubmit = user && selectedSupplierId && selectedSellerId && selectedSellingPointId && selectedActivityId && placedOrder !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(prev => ({ ...prev, submitting: true }));
    
    try {
      const visitData = {
        supplierCompanyId: selectedSupplierId,
        sellingPointId: selectedSellingPointId,
        activityId: selectedActivityId,
        agentId: user!.id,
        visitDate: formatDateForDatabase(selectedDate),
        personVisitedId: visitedPerson ? personVisitedId : null,
        placedOrder: placedOrder,
        hoursSpend: hoursSpent ? parseInt(hoursSpent, 10) : null,
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
      setSelectedSupplierId('');
      setSelectedSellerId('');
      setSelectedSellingPointId('');
      setSelectedActivityId('');
      setSelectedDate(new Date());
      setPlacedOrder(null);
      setPhotos([]);
      setHoursSpent('');
    } catch (error) {
      console.error('Error submitting visit:', error);
      setResultDialogContent('Errore nell\'invio della visita. Per favore riprova più tardi.');
      setShowResultDialog(true);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
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

  return (
    <AgentOrAbove>
      <>
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
          <CardContent className="p-6 space-y-4 md:space-y-6">
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
                onSelect={setSelectedSupplierId}
                placeholder="Scegli un'azienda fornitrice..."
                searchPlaceholder="Cerca fornitori..."
                disabled={isLoadingSuppliers}
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
                  onSelect={setSelectedSellerId}
                  placeholder="Scegli un cliente..."
                  searchPlaceholder="Cerca clienti..."
                  disabled={isLoadingSellers}
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
                <SearchableSelect
                  options={sellingPointOptions}
                  value={selectedSellingPointId}
                  onSelect={setSelectedSellingPointId}
                  placeholder="Scegli un punto vendita..."
                  searchPlaceholder="Cerca punti vendita..."
                  disabled={isLoadingSellingPoints}
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
                  onSelect={setSelectedActivityId}
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
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg text-gray-900">
                    <h3 className="font-medium text-blue-900">Riepilogo visita</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Email utente:</span> {user?.email}</p>
                      <p><span className="font-medium">Data:</span> {formatDateForDisplay(selectedDate)}</p>
                      <p><span className="font-medium">Fornitore:</span> {selectedSupplier?.name}</p>
                      <p><span className="font-medium">Cliente:</span> {selectedSeller?.name}</p>
                      <p><span className="font-medium">Punto vendita:</span> {selectedSellingPoint?.name}</p>
                      <p><span className="font-medium">Attività:</span> {selectedActivity?.name}</p>
                      <p><span className="font-medium">Ordine:</span> {placedOrder ? 'Sì' : 'No'}</p>
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
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading.submitting}
                  className="w-full"
                  size="lg"
                >
                  {loading.submitting ? 'Invio in corso...' : 'Invia rapporto visita'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </>
    </AgentOrAbove>
  );
};
