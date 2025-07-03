import React, { useState, useEffect } from 'react';
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

type Company = Database['public']['Tables']['companies']['Row'];
type SellingPointWithAddress = Database['public']['Tables']['sellingPoints']['Row'] & { addresses?: Database['public']['Tables']['addresses']['Row'] };
type VisitActivity = Database['public']['Tables']['visitActivities']['Row'];
type Person = Database['public']['Tables']['people']['Row'];

interface NewVisitFormProps {}

export const NewVisitForm: React.FC<NewVisitFormProps> = () => {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [sellers, setSellers] = useState<Company[]>([]);
  const [sellingPoints, setSellingPoints] = useState<SellingPointWithAddress[]>([]);
  const [activities, setActivities] = useState<VisitActivity[]>([]);
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

  useEffect(() => {
    fetchSuppliers();
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
      fetchSellers();
      // Reset subsequent selections
      setSelectedSellerId('');
      setSelectedSellingPointId('');
      setSelectedActivityId('');
      setSellers([]);
      setSellingPoints([]);
      setActivities([]);
    }
  }, [selectedSupplierId]);

  // Load selling points when seller is selected
  useEffect(() => {
    if (selectedSellerId && selectedSupplierId) {
      fetchSellingPoints();
      // Reset subsequent selections
      setSelectedSellingPointId('');
      setSelectedActivityId('');
      setSellingPoints([]);
      setActivities([]);
    }
  }, [selectedSellerId, selectedSupplierId]);

  // Load activities when selling point is selected
  useEffect(() => {
    if (selectedSellingPointId) {
      fetchActivities();
      // Reset subsequent selections
      setSelectedActivityId('');
      setActivities([]);
    }
  }, [selectedSellingPointId]);

  // Set default for placedOrder to false when an activity is selected
  useEffect(() => {
    if (selectedActivityId) setPlacedOrder(false);
  }, [selectedActivityId]);

  const fetchSuppliers = async () => {
    setLoading(prev => ({ ...prev, suppliers: true }));
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('isSupplier', true);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(prev => ({ ...prev, suppliers: false }));
    }
  };

  const fetchSellers = async () => {
    setLoading(prev => ({ ...prev, sellers: true }));
    try {
      // First, get all selling companies
      const { data: allSellers, error: sellersError } = await supabase
        .from('companies')
        .select('*')
        .eq('isSeller', true);

      if (sellersError) throw sellersError;

      // Then, filter sellers that have selling points connected to the selected supplier
      const { data: relationships, error: relationshipsError } = await supabase
        .from('companySellingPoint')
        .select(`
          sellingPointId,
          sellingPoints!inner(sellerCompanyId)
        `)
        .eq('supplierCompanyId', selectedSupplierId);

      if (relationshipsError) throw relationshipsError;

      // Get unique seller company IDs that have relationships with the supplier
      const connectedSellerIds = [
        ...new Set(
          relationships?.map(rel => rel.sellingPoints?.sellerCompanyId).filter(Boolean) || []
        )
      ];

      // Filter sellers to only include those with connected selling points
      const filteredSellers = allSellers?.filter(seller => 
        connectedSellerIds.includes(seller.id)
      ) || [];

      setSellers(filteredSellers);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(prev => ({ ...prev, sellers: false }));
    }
  };

  const fetchSellingPoints = async () => {
    setLoading(prev => ({ ...prev, sellingPoints: true }));
    try {
      const { data, error } = await supabase
        .from('sellingPoints')
        .select('*, addresses(*)')
        .eq('sellerCompanyId', selectedSellerId)
        .in('id', 
          await supabase
            .from('companySellingPoint')
            .select('sellingPointId')
            .eq('supplierCompanyId', selectedSupplierId)
            .then(({ data }) => data?.map(item => item.sellingPointId) || [])
        );

      if (error) throw error;
      setSellingPoints((data || []) as SellingPointWithAddress[]);
    } catch (error) {
      console.error('Error fetching selling points:', error);
    } finally {
      setLoading(prev => ({ ...prev, sellingPoints: false }));
    }
  };

  const fetchActivities = async () => {
    setLoading(prev => ({ ...prev, activities: true }));
    try {
      const { data, error } = await supabase
        .from('visitActivities')
        .select('*');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };

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
      const { data, error } = await supabase
        .from('visits')
        .insert({
          supplierCompanyId: selectedSupplierId,
          sellingPointId: selectedSellingPointId,
          activityId: selectedActivityId,
          agentId: user!.id,
          visitDate: selectedDate.toISOString().split('T')[0],
          personVisitedId: null,
          placedOrder: placedOrder
        })
        .select()
        .single();
      if (error) throw error;
      setResultDialogContent('Visita registrata correttamente!');
      setShowResultDialog(true);
      // Reset form after successful submission
      setSelectedSupplierId('');
      setSelectedSellerId('');
      setSelectedSellingPointId('');
      setSelectedActivityId('');
      setSelectedDate(new Date());
      setSellers([]);
      setSellingPoints([]);
      setActivities([]);
      setPlacedOrder(null);
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

  return (
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Agent Email Display - Top Right */}
          <div className="flex justify-end mb-4">
            <div className="w-64 flex items-center gap-2">
              <div className="border rounded px-3 py-2 bg-white text-gray-700 w-full truncate" title={user?.email || ''}>
                {user?.email || '...'}
              </div>
              <button
                className="p-2 rounded hover:bg-gray-200 transition"
                onClick={handleLogout}
                title="Logout"
                type="button"
                disabled={!user?.email}
              >
                <Power className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                <MapPin className="w-6 h-6" />
                Nuovo Rapporto Visita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Data Visita
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
                      {selectedDate ? format(selectedDate, "PPP") : <span>Scegli una data</span>}
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
              <div className="space-y-2">
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
                  disabled={loading.suppliers}
                />
              </div>

              {/* Step 2: Azienda Venditrice */}
              {selectedSupplierId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Azienda Venditrice
                  </label>
                  <SearchableSelect
                    options={sellerOptions}
                    value={selectedSellerId}
                    onSelect={setSelectedSellerId}
                    placeholder="Scegli un'azienda venditrice..."
                    searchPlaceholder="Cerca aziende venditrici..."
                    disabled={loading.sellers}
                  />
                </div>
              )}

              {/* Step 3: Punto Vendita */}
              {selectedSellerId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Punto Vendita
                  </label>
                  <SearchableSelect
                    options={sellingPointOptions}
                    value={selectedSellingPointId}
                    onSelect={setSelectedSellingPointId}
                    placeholder="Scegli un punto vendita..."
                    searchPlaceholder="Cerca punti vendita..."
                    disabled={loading.sellingPoints}
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
                    disabled={loading.activities}
                  />
                </div>
              )}

              {/* Ordine completato Switch */}
              {selectedActivityId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2" htmlFor="ordine-completato-switch">
                    Ordine completato
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-6 text-center">
                      {placedOrder ? 'Sì' : 'No'}
                    </span>
                    <Switch
                      id="ordine-completato-switch"
                      checked={placedOrder === true}
                      onCheckedChange={setPlacedOrder}
                    />
                  </div>
                </div>
              )}

              {/* Selection Summary and Submit Button */}
              {selectedActivityId && (
                <>
                  {canSubmit && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900">Riepilogo Visita</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Email utente:</span> {user?.email}</p>
                        <p><span className="font-medium">Data:</span> {format(selectedDate, "PPP")}</p>
                        <p><span className="font-medium">Fornitore:</span> {selectedSupplier?.name}</p>
                        <p><span className="font-medium">Azienda Venditrice:</span> {selectedSeller?.name}</p>
                        <p><span className="font-medium">Punto Vendita:</span> {selectedSellingPoint?.name}</p>
                        <p><span className="font-medium">Attività:</span> {selectedActivity?.name}</p>
                        <p><span className="font-medium">Ordine completato:</span> {placedOrder ? 'Sì' : 'No'}</p>
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading.submitting}
                    className="w-full"
                    size="lg"
                  >
                    {loading.submitting ? 'Invio in corso...' : 'Invia Rapporto Visita'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
