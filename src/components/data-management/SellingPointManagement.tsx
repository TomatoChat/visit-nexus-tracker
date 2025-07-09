import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { geocodeAddress } from '@/lib/utils';
import { Trash2, Pencil, Search, Plus } from 'lucide-react';

type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Address = Database['public']['Tables']['addresses']['Row'];

interface SellingPointManagementProps {
  // Props will be added later if needed
}

const SellingPointManagement: React.FC<SellingPointManagementProps> = () => {
  const { toast } = useToast();
  const [sellingPoints, setSellingPoints] = useState<(SellingPoint & { addresses: Address, companies: Company })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSellingPoint, setEditingSellingPoint] = useState<(SellingPoint & { addresses: Address, companies: Company }) | null>(null);

  // Add New/Edit Form State
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSellerCompanyId, setSelectedSellerCompanyId] = useState<string | undefined>(undefined);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);

  const [sellerCompanies, setSellerCompanies] = useState<Company[]>([]);
  const [isLoadingSellerCompanies, setIsLoadingSellerCompanies] = useState(false);

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
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const fetchSellingPoints = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sellingPoints')
        .select(`
          *,
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

  // Auto-geocode when mandatory fields are filled in address form
  useEffect(() => {
    const hasMandatoryFields = addressForm.city && addressForm.stateProvince && addressForm.country;
    const hasCoordinates = addressForm.latitude && addressForm.longitude;

    if (showAddressForm && hasMandatoryFields && !hasCoordinates && !isGeocoding) {
      setIsGeocoding(true);
      geocodeAddress({
        addressLine1: addressForm.addressLine1,
        city: addressForm.city,
        stateProvince: addressForm.stateProvince,
        country: addressForm.country,
        postalCode: addressForm.postalCode,
      }, import.meta.env.VITE_GOOGLE_MAPS_KEY)
        .then(({ lat, lng }) => {
          setAddressForm(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
        })
        .catch((err) => console.log('Geocoding failed:', err.message))
        .finally(() => setIsGeocoding(false));
    }
  }, [addressForm, showAddressForm, isGeocoding]);

  const sellerCompanyOptions = useMemo(() => sellerCompanies.map(c => ({ value: c.id, label: c.name })), [sellerCompanies]);

  const handleCreateAddress = async () => {
    if (!addressForm.city || !addressForm.stateProvince || !addressForm.country) {
      toast({ title: 'Errore di validazione', description: 'Città, Provincia e Nazione sono obbligatori.', variant: 'destructive' });
      return;
    }
    let latitude = addressForm.latitude;
    let longitude = addressForm.longitude;

    if (!latitude || !longitude) {
      setIsGeocoding(true);
      try {
        const geoResult = await geocodeAddress({
          addressLine1: addressForm.addressLine1, city: addressForm.city, stateProvince: addressForm.stateProvince, country: addressForm.country, postalCode: addressForm.postalCode,
        }, import.meta.env.VITE_GOOGLE_MAPS_KEY);
        latitude = geoResult.lat.toString(); longitude = geoResult.lng.toString();
        setAddressForm(prev => ({ ...prev, latitude, longitude }));
      } catch (err: any) {
        toast({ title: 'Errore Geocoding', description: err.message || 'Impossibile ottenere coordinate.', variant: 'destructive' });
        setIsGeocoding(false); return;
      } finally {
        setIsGeocoding(false);
      }
    }

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedSellerCompanyId || !selectedAddressId) {
      toast({ title: 'Errore di validazione', description: 'Nome, Azienda Venditrice e Indirizzo sono obbligatori.', variant: 'destructive' });
      return;
    }

    const sellingPointData = {
      name,
      phoneNumber: phoneNumber || null,
      sellerCompanyId: selectedSellerCompanyId,
      addressId: selectedAddressId,
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

  const filteredSellingPoints = useMemo(() => {
    return sellingPoints.filter(sp =>
      sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sp.companies as Company)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sp.addresses as Address)?.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sellingPoints, searchTerm]);

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
              <Label htmlFor="seller-company">Azienda Venditrice <span className="text-red-500">*</span></Label>
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
                        <div className="flex-1"><Label htmlFor="sp-addr-lat">Latitudine</Label><Input id="sp-addr-lat" type="number" step="any" value={addressForm.latitude} onChange={e => setAddressForm(p => ({ ...p, latitude: e.target.value }))} placeholder={isGeocoding ? "Caricamento..." : ""} disabled={isGeocoding} /></div>
                        <div className="flex-1"><Label htmlFor="sp-addr-lng">Longitudine</Label><Input id="sp-addr-lng" type="number" step="any" value={addressForm.longitude} onChange={e => setAddressForm(p => ({ ...p, longitude: e.target.value }))} placeholder={isGeocoding ? "Caricamento..." : ""} disabled={isGeocoding} /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => { setShowAddressForm(false); setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' }); setIsGeocoding(false); }}>Annulla</Button>
                        <Button type="button" disabled={isGeocoding} onClick={handleCreateAddress}>{isGeocoding ? 'Caricamento...' : 'Salva Indirizzo'}</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-between items-center space-x-2">
              <div>
                {editingSellingPoint && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
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
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CardTitle>Punti Vendita</CardTitle>
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
              className="ml-2 w-48"
              placeholder="Cerca per nome, azienda o città..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onBlur={() => setShowSearch(false)}
              onKeyDown={e => {
                if (e.key === 'Escape') setShowSearch(false);
              }}
            />
          )}
        </div>
        <Button 
          variant="outline" 
          className="border-black text-black hover:bg-gray-50" 
          onClick={() => { setEditingSellingPoint(null); resetForm(); setShowAddForm(true); }}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (<p>Caricamento...</p>) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {sellingPoints.length} punti vendita
            </div>
            <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Azienda Venditrice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Indirizzo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Telefono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSellingPoints.map(sp => {
                  const address = sp.addresses;
                  const company = sp.companies;
                  return (
                    <tr key={sp.id} onClick={() => handleEdit(sp)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 break-words">{sp.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 break-words">{company?.name || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 break-words">{address ? `${address.addressLine1 || ''}${address.addressLine1 && address.city ? ', ' : ''}${address.city || ''}` : 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 break-words">{sp.phoneNumber || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">
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
