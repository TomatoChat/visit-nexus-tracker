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

type Company = Database['public']['Tables']['companies']['Row'];
type Address = Database['public']['Tables']['addresses']['Row'];

interface CompanyManagementProps {
  // Props will be added later if needed
}

const CompanyManagement: React.FC<CompanyManagementProps> = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Add New Company Form State
  const [companyName, setCompanyName] = useState('');
  const [companyVat, setCompanyVat] = useState('');
  const [companyType, setCompanyType] = useState<'supplier' | 'seller' | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);

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

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          addresses (*)
        `)
        .order('name', { ascending: true });
      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({ title: 'Error fetching companies', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

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
            .limit(20); // Limit results for performance
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

  // Auto-geocode when mandatory fields are filled
  useEffect(() => {
    const hasMandatoryFields = addressForm.city && addressForm.stateProvince && addressForm.country;
    const hasCoordinates = addressForm.latitude && addressForm.longitude;

    if (hasMandatoryFields && !hasCoordinates && !isGeocoding && showAddressForm) {
      setIsGeocoding(true);
      geocodeAddress({
        addressLine1: addressForm.addressLine1,
        city: addressForm.city,
        stateProvince: addressForm.stateProvince,
        country: addressForm.country,
        postalCode: addressForm.postalCode,
      }, import.meta.env.VITE_GOOGLE_MAPS_KEY)
        .then(({ lat, lng }) => {
          setAddressForm(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));
        })
        .catch((err) => {
          console.log('Geocoding failed:', err.message);
        })
        .finally(() => {
          setIsGeocoding(false);
        });
    }
  }, [addressForm.city, addressForm.stateProvince, addressForm.country, addressForm.addressLine1, addressForm.postalCode, showAddressForm, isGeocoding]);


  const handleCreateAddress = async () => {
    if (!addressForm.city || !addressForm.stateProvince || !addressForm.country) {
      toast({
        title: 'Errore di validazione',
        description: 'Città, Provincia e Nazione sono obbligatori per l\'indirizzo.',
        variant: 'destructive',
      });
      return;
    }

    let latitude = addressForm.latitude;
    let longitude = addressForm.longitude;

    if (!latitude || !longitude) {
      setIsGeocoding(true);
      try {
        const geoResult = await geocodeAddress({
          addressLine1: addressForm.addressLine1,
          city: addressForm.city,
          stateProvince: addressForm.stateProvince,
          country: addressForm.country,
          postalCode: addressForm.postalCode,
        }, import.meta.env.VITE_GOOGLE_MAPS_KEY);
        latitude = geoResult.lat.toString();
        longitude = geoResult.lng.toString();
        setAddressForm(prev => ({ ...prev, latitude, longitude }));
      } catch (err: any) {
        toast({
          title: 'Errore Geocoding',
          description: err.message || 'Impossibile ottenere coordinate.',
          variant: 'destructive',
        });
        setIsGeocoding(false);
        return;
      } finally {
        setIsGeocoding(false);
      }
    }

    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          addressLine1: addressForm.addressLine1 || null,
          addressLine2: addressForm.addressLine2 || null,
          city: addressForm.city,
          stateProvince: addressForm.stateProvince,
          postalCode: addressForm.postalCode || null,
          country: addressForm.country,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedAddressId(data.id);
      setShowAddressForm(false);
      setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' });
      toast({ title: 'Successo!', description: 'Indirizzo creato con successo!' });
      // Refresh address options
      setAddressSearch(data.addressLine1?.split(' ')[0] || data.city); // Trigger a search for the new address
    } catch (error: any) {
      console.error('Error creating address:', error);
      toast({ title: 'Errore', description: error.message || 'Impossibile creare l\'indirizzo.', variant: 'destructive' });
    }
  };

  const resetAddCompanyForm = () => {
    setCompanyName('');
    setCompanyVat('');
    setCompanyType(null);
    setSelectedAddressId(undefined);
    setShowAddressForm(false);
    setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' });
    setEditingCompany(null);
  };

  const handleAddOrUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companyVat || !companyType || !selectedAddressId) {
      toast({ title: 'Errore di validazione', description: 'Compila tutti i campi obbligatori (*).', variant: 'destructive' });
      return;
    }

    const companyData = {
      name: companyName,
      codeVAT: companyVat,
      isSupplier: companyType === 'supplier',
      isSeller: companyType === 'seller',
      addressId: selectedAddressId,
      // categoryId will need to be handled if it's a required field. For now, assuming it can be null or has a default.
      // Let's add a placeholder or remove if not used in the form yet.
      // For now, I'll assume categoryId is not part of this simplified form.
      // categoryId: 'default-category-id', // Replace with actual logic if needed
    };

    try {
      let error;
      if (editingCompany) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', editingCompany.id);
        error = updateError;
      } else {
        // Add new company
        const { error: insertError } = await supabase.from('companies').insert(companyData);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: 'Successo!', description: `Azienda ${editingCompany ? 'aggiornata' : 'creata'} con successo!` });
      setShowAddForm(false);
      resetAddCompanyForm();
      fetchCompanies(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || `Impossibile ${editingCompany ? 'aggiornare' : 'creare'} l'azienda.`, variant: 'destructive' });
    }
  };

  const handleEdit = (company: Company & { addresses: Address }) => {
    setEditingCompany(company);
    setCompanyName(company.name);
    setCompanyVat(company.codeVAT);
    if (company.isSeller) setCompanyType('seller');
    else if (company.isSupplier) setCompanyType('supplier');
    else setCompanyType(null);
    setSelectedAddressId(company.addressId);
    // Pre-fill address search to show the current address in SearchableSelect
    if (company.addresses) {
        setAddressSearch(company.addresses.addressLine1 || company.addresses.city);
    }
    setShowAddForm(true);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.codeVAT.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  if (showAddForm || editingCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingCompany ? 'Modifica Azienda' : 'Crea Nuova Azienda'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddOrUpdateCompany} className="space-y-4">
            <div>
              <Label htmlFor="company-name">Nome Azienda <span className="text-red-500">*</span></Label>
              <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Inserisci il nome dell'azienda" required />
            </div>
            <div>
              <Label htmlFor="company-vat">Partita IVA <span className="text-red-500">*</span></Label>
              <Input id="company-vat" value={companyVat} onChange={e => setCompanyVat(e.target.value)} placeholder="Inserisci la partita IVA" required />
            </div>
            <div>
              <Label>Tipo Azienda <span className="text-red-500">*</span></Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={companyType === 'supplier'} onChange={() => setCompanyType(companyType === 'supplier' ? null : 'supplier')} /> Fornitore
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={companyType === 'seller'} onChange={() => setCompanyType(companyType === 'seller' ? null : 'seller')} /> Venditore
                </label>
              </div>
            </div>
            <div>
              <Label>Indirizzo <span className="text-red-500">*</span></Label>
              {!showAddressForm ? (
                <div className="flex gap-2">
                  <SearchableSelect
                    options={addressOptions}
                    value={selectedAddressId}
                    onSelect={(val) => setSelectedAddressId(val)}
                    onSearchChange={setAddressSearch}
                    placeholder="Cerca indirizzo per via o città..."
                    searchPlaceholder="Digita indirizzo o città..."
                    disabled={addressLoading}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setShowAddressForm(true)} className="px-3">+</Button>
                </div>
              ) : (
                <div className="space-y-2 border rounded p-2 mt-2">
                  <div><Label htmlFor="address-line1">Via</Label><Input id="address-line1" value={addressForm.addressLine1} onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))} placeholder="Via" /></div>
                  <div><Label htmlFor="address-line2">Civico</Label><Input id="address-line2" value={addressForm.addressLine2} onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))} placeholder="Civico" /></div>
                  <div><Label htmlFor="address-city">Città <span className="text-red-500">*</span></Label><Input id="address-city" value={addressForm.city} onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))} placeholder="Città" required /></div>
                  <div><Label htmlFor="address-state">Provincia <span className="text-red-500">*</span></Label><Input id="address-state" value={addressForm.stateProvince} onChange={(e) => setAddressForm(prev => ({ ...prev, stateProvince: e.target.value }))} placeholder="Provincia" required /></div>
                  <div><Label htmlFor="address-postal">CAP</Label><Input id="address-postal" value={addressForm.postalCode} onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))} placeholder="CAP" /></div>
                  <div><Label htmlFor="address-country">Nazione <span className="text-red-500">*</span></Label><Input id="address-country" value={addressForm.country} onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))} placeholder="Nazione" required /></div>
                  <div className="flex gap-2">
                    <div className="flex-1"><Label htmlFor="address-lat">Latitudine</Label><Input id="address-lat" type="number" step="any" value={addressForm.latitude} onChange={(e) => setAddressForm(prev => ({ ...prev, latitude: e.target.value }))} placeholder={isGeocoding ? "Caricamento..." : "Latitudine"} disabled={isGeocoding} /></div>
                    <div className="flex-1"><Label htmlFor="address-lng">Longitudine</Label><Input id="address-lng" type="number" step="any" value={addressForm.longitude} onChange={(e) => setAddressForm(prev => ({ ...prev, longitude: e.target.value }))} placeholder={isGeocoding ? "Caricamento..." : "Longitudine"} disabled={isGeocoding} /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setShowAddressForm(false); setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' }); setIsGeocoding(false); }}>Annulla</Button>
                    <Button type="button" disabled={isGeocoding} onClick={handleCreateAddress}>{isGeocoding ? 'Caricamento...' : 'Salva Indirizzo'}</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetAddCompanyForm(); }}>Annulla</Button>
              <Button type="submit">{editingCompany ? 'Salva Modifiche' : 'Crea Azienda'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Aziende</CardTitle>
        <Button onClick={() => { setEditingCompany(null); resetAddCompanyForm(); setShowAddForm(true); }}>Nuova Azienda</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Cerca per nome o P.IVA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isLoading ? (
          <p>Caricamento aziende...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P.IVA</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indirizzo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => {
                  const address = company.addresses as Address; // Cast because we selected it
                  return (
                    <tr key={company.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.codeVAT}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.isSeller && company.isSupplier ? 'Venditore & Fornitore' : company.isSeller ? 'Venditore' : company.isSupplier ? 'Fornitore' : 'N/A'}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {address ? `${address.addressLine1 || ''}, ${address.city}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="link" onClick={() => handleEdit(company as Company & { addresses: Address })}>Modifica</Button>
                        {/* Delete button can be added here */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredCompanies.length === 0 && !isLoading && <p>Nessuna azienda trovata.</p>}
      </CardContent>
    </Card>
  );
};

export default CompanyManagement;
