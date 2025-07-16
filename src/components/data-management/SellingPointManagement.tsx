import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Pencil, Search, Plus, Link, Building } from 'lucide-react';
import SupplierRelationships from './SupplierRelationships';
import { useSuppliers, useCompanySellingPoints, useCreateCompanySellingPoint, useDeleteCompanySellingPoint, useAllUsers } from '@/hooks/use-data';

type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'] & { accountManager?: string };
type Company = Database['public']['Tables']['companies']['Row'];
type Address = Database['public']['Tables']['addresses']['Row'];

interface SellingPointManagementProps {
  readOnly?: boolean;
  searchTerm?: string;
  sellerFilters?: string[];
  triggerAddForm?: boolean;
  onAddFormShown?: () => void;
  accountManagerFilter?: string | null;
}

const SellingPointManagement: React.FC<SellingPointManagementProps> = ({ readOnly = false, searchTerm = '', sellerFilters = [], triggerAddForm = false, onAddFormShown, accountManagerFilter }) => {
  const { toast } = useToast();
  const [sellingPoints, setSellingPoints] = useState<(SellingPoint & { addresses: Address, companies: Company })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSellingPoint, setEditingSellingPoint] = useState<(SellingPoint & { addresses: Address, companies: Company }) | null>(null);
  const [viewingRelationships, setViewingRelationships] = useState<string | null>(null);

  // Add New/Edit Form State
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSellerCompanyId, setSelectedSellerCompanyId] = useState<string | undefined>(undefined);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  
  // Supplier relationships state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [relationshipStartDate, setRelationshipStartDate] = useState<Date>(new Date());
  const [relationshipEndDate, setRelationshipEndDate] = useState<Date | undefined>(undefined);
  const [sellerCode, setSellerCode] = useState<string>('');
  const [showAddRelationshipForm, setShowAddRelationshipForm] = useState(false);

  const [sellerCompanies, setSellerCompanies] = useState<Company[]>([]);
  const [isLoadingSellerCompanies, setIsLoadingSellerCompanies] = useState(false);
  
  // Data hooks for supplier relationships
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: relationships = [], isLoading: isLoadingRelationships } = useCompanySellingPoints(editingSellingPoint?.id || '');
  const createRelationshipMutation = useCreateCompanySellingPoint();
  const deleteRelationshipMutation = useDeleteCompanySellingPoint();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressOptions, setAddressOptions] = useState<Array<{ value: string; label: string; subtitle?: string }>>([]);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    latitude: '',
    longitude: ''
  });

  const { data: users = [], isLoading: isLoadingUsers } = useAllUsers();
  const [selectedAccountManagerId, setSelectedAccountManagerId] = useState<string | undefined>(undefined);

  const fetchSellingPoints = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sellingPoints')
        .select(`
          *,
          accountManager,
          addresses (*),
          companies!sellingPoints_sellerCompanyId_fkey (*)
        `)
        .order('name', { ascending: true });
      if (error) throw error;
      setSellingPoints(data as any || []);
    } catch (error: any) {
      toast({ title: 'Error fetching selling points', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellingPoints();
  }, []);

  // Fetch seller companies (companies where isSeller is true)
  useEffect(() => {
    const fetchSellerCompanies = async () => {
      setIsLoadingSellerCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('isSeller', true)
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching seller companies:', error);
        toast({ title: 'Error fetching seller companies', variant: 'destructive' });
      } else {
        setSellerCompanies(data || []);
      }
      setIsLoadingSellerCompanies(false);
    };
    fetchSellerCompanies();
  }, [toast]);

  // Fetch addresses for dropdown
   useEffect(() => {
    if (!showAddressForm) {
      setAddressLoading(true);
      (async () => {
        try {
          const { data } = await supabase
            .from("addresses")
            .select("id, addressLine1, city")
            .or(`addressLine1.ilike.%${addressSearch}%,city.ilike.%${addressSearch}%`)
            .limit(20);
          setAddressOptions(
            (data || []).map((a: any) => ({
              value: a.id,
              label: `${a.addressLine1 || "(No address line)"}, ${a.city || ""}`,
              subtitle: a.city
            }))
          );
        } finally {
          setAddressLoading(false);
        }
      })();
    }
  }, [addressSearch, showAddressForm]);



  const sellerCompanyOptions = useMemo(() => sellerCompanies.map(c => ({ value: c.id, label: c.name })), [sellerCompanies]);
  const supplierOptions = useMemo(() => suppliers.map(s => ({ value: s.id, label: s.name })), [suppliers]);

  const handleCreateAddress = async () => {
    if (!addressForm.city || !addressForm.stateProvince || !addressForm.country) {
      toast({ title: 'Errore di validazione', description: 'Città, Provincia e Nazione sono obbligatori.', variant: 'destructive' });
      return;
    }

    if (!addressForm.latitude || !addressForm.longitude) {
      toast({ title: 'Errore di validazione', description: 'Latitudine e Longitudine sono obbligatorie per l\'indirizzo.', variant: 'destructive' });
      return;
    }

    const latitude = addressForm.latitude;
    const longitude = addressForm.longitude;

    try {
      const { data, error } = await supabase.from('addresses').insert({
        addressLine1: addressForm.addressLine1 || null, addressLine2: addressForm.addressLine2 || null, city: addressForm.city, stateProvince: addressForm.stateProvince, postalCode: addressForm.postalCode || null, country: addressForm.country, latitude: parseFloat(latitude), longitude: parseFloat(longitude)
      }).select().single();
      if (error) throw error;
      setSelectedAddressId(data.id);
      setShowAddressForm(false);
      setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' });
      toast({ title: 'Successo!', description: 'Indirizzo creato!' });
      setAddressSearch(data.addressLine1?.split(' ')[0] || data.city);
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || 'Impossibile creare l\'indirizzo.', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setSelectedSellerCompanyId(undefined);
    setSelectedAddressId(undefined);
    setShowAddressForm(false);
    setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' });
    setEditingSellingPoint(null);
    setViewingRelationships(null);
    // Reset supplier relationship form
    setSelectedSupplierId('');
    setRelationshipStartDate(new Date());
    setRelationshipEndDate(undefined);
    setSellerCode('');
    setShowAddRelationshipForm(false);
    setSelectedAccountManagerId(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedSellerCompanyId || !selectedAddressId) {
      toast({ title: 'Errore di validazione', description: 'Nome, Azienda Cliente e Indirizzo sono obbligatori.', variant: 'destructive' });
      return;
    }

    const sellingPointData = {
      name,
      phoneNumber: phoneNumber || null,
      sellerCompanyId: selectedSellerCompanyId,
      addressId: selectedAddressId,
      accountManager: selectedAccountManagerId || null,
    };

    try {
      let error;
      if (editingSellingPoint) {
        const { error: updateError } = await supabase.from('sellingPoints').update(sellingPointData).eq('id', editingSellingPoint.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('sellingPoints').insert(sellingPointData);
        error = insertError;
      }
      if (error) throw error;
      toast({ title: 'Successo!', description: `Punto vendita ${editingSellingPoint ? 'aggiornato' : 'creato'}!` });
      setShowAddForm(false);
      resetForm();
      fetchSellingPoints();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || `Impossibile ${editingSellingPoint ? 'aggiornare' : 'creare'} il punto vendita.`, variant: 'destructive' });
    }
  };

  const handleEdit = (sp: SellingPoint & { addresses: Address, companies: Company }) => {
    setEditingSellingPoint(sp);
    setName(sp.name);
    setPhoneNumber(sp.phoneNumber || '');
    setSelectedSellerCompanyId(sp.sellerCompanyId);
    setSelectedAddressId(sp.addressId);
    setSelectedAccountManagerId(sp.accountManager || undefined);
    if (sp.addresses) {
      setAddressSearch(sp.addresses.addressLine1 || sp.addresses.city);
    }
    setShowAddForm(true);
  };

  const handleSoftDelete = async (sp: SellingPoint & { addresses: Address, companies: Company }) => {
    try {
      const { error } = await supabase
        .from('sellingPoints')
        .delete()
        .eq('id', sp.id);
      if (error) throw error;
      toast({ title: 'Successo!', description: 'Punto vendita eliminato con successo!' });
      fetchSellingPoints();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || 'Impossibile eliminare il punto vendita.', variant: 'destructive' });
    }
  };

  const handleViewRelationships = (sellingPointId: string, sellingPointName: string) => {
    setViewingRelationships(sellingPointId);
  };

  const handleAddSupplierRelationship = async () => {
    if (!selectedSupplierId || !editingSellingPoint) {
      toast({ 
        title: 'Errore di validazione', 
        description: 'Seleziona un fornitore per creare la relazione.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const relationshipData = {
        supplierCompanyId: selectedSupplierId,
        sellingPointId: editingSellingPoint.id,
        startDate: relationshipStartDate.toISOString().split('T')[0],
        endDate: relationshipEndDate ? relationshipEndDate.toISOString().split('T')[0] : null,
        sellerSellingPointCode: sellerCode || null,
      };

      await createRelationshipMutation.mutateAsync(relationshipData);
      
      // Reset form
      setSelectedSupplierId('');
      setRelationshipStartDate(new Date());
      setRelationshipEndDate(undefined);
      setSellerCode('');
      setShowAddRelationshipForm(false);
      
      toast({ title: 'Successo!', description: 'Relazione fornitore creata!' });
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Impossibile creare la relazione fornitore.', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteSupplierRelationship = async (relationshipId: string) => {
    if (!editingSellingPoint || !confirm('Sei sicuro di voler eliminare questa relazione?')) return;

    try {
      await deleteRelationshipMutation.mutateAsync({
        id: relationshipId,
        sellingPointId: editingSellingPoint.id
      });
      toast({ title: 'Successo!', description: 'Relazione fornitore eliminata!' });
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Impossibile eliminare la relazione fornitore.', 
        variant: 'destructive' 
      });
    }
  };

  const filteredSellingPoints = useMemo(() => {
    return sellingPoints.filter(sp => {
      // Apply search filter
      const matchesSearch = sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sp.companies as Company)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sp.addresses as Address)?.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply seller filters - if no filters selected, show all; otherwise only show selected sellers
      const matchesSeller = sellerFilters.length === 0 || sellerFilters.includes(sp.sellerCompanyId);
      
      // Apply accountManager filter
      const matchesAccountManager = !accountManagerFilter || sp.accountManager === accountManagerFilter;
      
      return matchesSearch && matchesSeller && matchesAccountManager;
    });
  }, [sellingPoints, searchTerm, sellerFilters, accountManagerFilter]);

  useEffect(() => {
    if (triggerAddForm) {
      setShowAddForm(true);
      if (onAddFormShown) onAddFormShown();
    }
  }, [triggerAddForm, onAddFormShown]);

  if (viewingRelationships) {
    const sellingPoint = sellingPoints.find(sp => sp.id === viewingRelationships);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setViewingRelationships(null)}
            size="sm"
          >
            ← Torna ai punti vendita
          </Button>
        </div>
        <SupplierRelationships 
          sellingPointId={viewingRelationships} 
          sellingPointName={sellingPoint?.name || 'Punto Vendita'}
        />
      </div>
    );
  }

  if (showAddForm || editingSellingPoint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingSellingPoint ? 'Modifica Punto Vendita' : 'Nuovo Punto Vendita'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="sp-name">Nome Punto Vendita <span className="text-red-500">*</span></Label><Input id="sp-name" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><Label htmlFor="sp-phone">Telefono</Label><Input id="sp-phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></div>
            <div>
              <Label htmlFor="seller-company">Azienda Cliente <span className="text-red-500">*</span></Label>
              <SearchableSelect options={sellerCompanyOptions} value={selectedSellerCompanyId} onSelect={setSelectedSellerCompanyId} placeholder={isLoadingSellerCompanies ? "Caricamento..." : "Seleziona azienda"} searchPlaceholder="Cerca azienda..." disabled={isLoadingSellerCompanies} />
            </div>
            <div>
              <Label>Indirizzo <span className="text-red-500">*</span></Label>
              {editingSellingPoint ? (
                <div className="p-3 bg-gray-50 rounded border">
                  {editingSellingPoint.addresses ? (
                    <div className="text-sm text-gray-700">
                      <div>{editingSellingPoint.addresses.addressLine1 || ''}</div>
                      <div>{editingSellingPoint.addresses.addressLine2 || ''}</div>
                      <div>{editingSellingPoint.addresses.city || ''}, {editingSellingPoint.addresses.stateProvince || ''}</div>
                      <div>{editingSellingPoint.addresses.postalCode || ''} {editingSellingPoint.addresses.country || ''}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Nessun indirizzo associato</div>
                  )}
                </div>
              ) : (
                <>
                  {!showAddressForm ? (
                    <div className="flex gap-2">
                      <SearchableSelect options={addressOptions} value={selectedAddressId} onSelect={setSelectedAddressId} placeholder="Cerca indirizzo..." searchPlaceholder="Digita indirizzo..." disabled={addressLoading} className="flex-1" />
                      <Button type="button" variant="outline" onClick={() => setShowAddressForm(true)} className="px-3">+</Button>
                    </div>
                  ) : (
                    <div className="space-y-2 border rounded p-2 mt-2">
                      <div><Label htmlFor="sp-addr-l1">Via</Label><Input id="sp-addr-l1" value={addressForm.addressLine1} onChange={e => setAddressForm(p => ({ ...p, addressLine1: e.target.value }))} /></div>
                      <div><Label htmlFor="sp-addr-l2">Civico</Label><Input id="sp-addr-l2" value={addressForm.addressLine2} onChange={e => setAddressForm(p => ({ ...p, addressLine2: e.target.value }))} /></div>
                      <div><Label htmlFor="sp-addr-city">Città <span className="text-red-500">*</span></Label><Input id="sp-addr-city" value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} required /></div>
                      <div><Label htmlFor="sp-addr-state">Provincia <span className="text-red-500">*</span></Label><Input id="sp-addr-state" value={addressForm.stateProvince} onChange={e => setAddressForm(p => ({ ...p, stateProvince: e.target.value }))} required /></div>
                      <div><Label htmlFor="sp-addr-zip">CAP</Label><Input id="sp-addr-zip" type="number" step="1" value={addressForm.postalCode} onChange={e => setAddressForm(p => ({ ...p, postalCode: e.target.value }))} /></div>
                      <div><Label htmlFor="sp-addr-country">Nazione <span className="text-red-500">*</span></Label><Input id="sp-addr-country" value={addressForm.country} onChange={e => setAddressForm(p => ({ ...p, country: e.target.value }))} required /></div>
                      <div className="flex gap-2">
                        <div className="flex-1"><Label htmlFor="sp-addr-lat">Latitudine <span className="text-red-500">*</span></Label><Input id="sp-addr-lat" type="number" step="any" value={addressForm.latitude} onChange={e => setAddressForm(p => ({ ...p, latitude: e.target.value }))} placeholder="Latitudine" required /></div>
                        <div className="flex-1"><Label htmlFor="sp-addr-lng">Longitudine <span className="text-red-500">*</span></Label><Input id="sp-addr-lng" type="number" step="any" value={addressForm.longitude} onChange={e => setAddressForm(p => ({ ...p, longitude: e.target.value }))} placeholder="Longitudine" required /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => { setShowAddressForm(false); setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' }); }}>Annulla</Button>
                        <Button type="button" onClick={handleCreateAddress}>Salva Indirizzo</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <Label htmlFor="account-manager">Responsabile Cliente</Label>
              <SearchableSelect
                options={[{ value: '', label: 'Nessuno' }, ...users.map(u => ({ value: u.id, label: u.displayName }))]}
                value={selectedAccountManagerId || ''}
                onSelect={val => setSelectedAccountManagerId(val || undefined)}
                placeholder={isLoadingUsers ? 'Caricamento utenti...' : 'Seleziona responsabile'}
                searchPlaceholder="Cerca responsabile..."
                disabled={isLoadingUsers}
              />
            </div>
            
            {/* Supplier Relationships Section - only show when editing */}
            {editingSellingPoint && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-medium">Relazioni Fornitori</h3>
                </div>
                
                {/* Existing Relationships */}
                {isLoadingRelationships ? (
                  <p className="text-sm text-gray-500">Caricamento relazioni...</p>
                ) : relationships.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Relazioni esistenti:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {relationships.map((relationship) => (
                        <div key={relationship.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <div>
                            <span className="font-medium">{relationship.supplierCompany?.name}</span>
                            <span className="text-muted-foreground ml-2">
                              Dal: {new Date(relationship.startDate).toLocaleDateString('it-IT')}
                              {relationship.endDate && (
                                <span> - Al: {new Date(relationship.endDate).toLocaleDateString('it-IT')}</span>
                              )}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSupplierRelationship(relationship.id)}
                              className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                              title="Elimina relazione"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nessuna relazione fornitore configurata.</p>
                )}
                
                {/* Add New Relationship Button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => setShowAddRelationshipForm(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi Relazione Fornitore
                  </Button>
                </div>
                
                {/* Add New Relationship Form - only show when button is clicked */}
                {showAddRelationshipForm && (
                  <div className="space-y-3 border rounded-lg p-3 bg-muted">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">Nuova relazione fornitore:</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddRelationshipForm(false)}
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div>
                      <Label htmlFor="supplier-select">Fornitore <span className="text-red-500">*</span></Label>
                      <SearchableSelect
                        options={supplierOptions}
                        value={selectedSupplierId}
                        onSelect={setSelectedSupplierId}
                        placeholder="Seleziona fornitore..."
                        searchPlaceholder="Cerca fornitori..."
                        disabled={isLoadingSuppliers}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="start-date">Data inizio <span className="text-red-500">*</span></Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={relationshipStartDate.toISOString().split('T')[0]}
                        onChange={(e) => setRelationshipStartDate(new Date(e.target.value))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="seller-code">Codice punto vendita fornitore</Label>
                      <Input
                        id="seller-code"
                        value={sellerCode}
                        onChange={(e) => setSellerCode(e.target.value)}
                        placeholder="Codice opzionale..."
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowAddRelationshipForm(false)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Annulla
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddSupplierRelationship}
                        disabled={!selectedSupplierId}
                        size="sm"
                        className="flex-1"
                      >
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center space-x-2">
              <div>
                {editingSellingPoint && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                    aria-label="Elimina"
                    onClick={() => {
                      if (confirm("Sei sicuro di voler eliminare questo punto vendita?")) {
                        handleSoftDelete(editingSellingPoint);
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>Annulla</Button>
                <Button type="submit">{editingSellingPoint ? 'Salva Modifiche' : 'Crea Punto Vendita'}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-hidden">

      <CardContent>
        {isLoading ? (
          <p>Caricamento punti vendita...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">Azienda Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-2/5">Indirizzo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">Telefono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">Responsabile Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredSellingPoints.map(sp => {
                  const address = sp.addresses;
                  const company = sp.companies;
                  const accountManagerName = users.find(u => u.id === sp.accountManager)?.displayName || 'Nessuno';
                  return (
                    <tr key={sp.id} onClick={!readOnly ? () => handleEdit(sp) : undefined} className={!readOnly ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/50"}>
                      <td className="px-4 py-4 text-sm font-medium text-foreground break-words">{sp.name}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground break-words">{company?.name || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground break-words">{address ? `${address.addressLine1 || ''}${address.addressLine1 && address.city ? ', ' : ''}${address.city || ''}` : 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground break-words">{sp.phoneNumber || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground break-words">{accountManagerName}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {!readOnly && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                handleEdit(sp);
                              }}
                              aria-label="Modifica"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                if (confirm('Sei sicuro di voler eliminare questo punto vendita?')) {
                                  handleSoftDelete(sp);
                                }
                              }}
                              aria-label="Elimina"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
        {filteredSellingPoints.length === 0 && !isLoading && <p>Nessun punto vendita trovato.</p>}
      </CardContent>
    </Card>
  );
};

export default SellingPointManagement;
