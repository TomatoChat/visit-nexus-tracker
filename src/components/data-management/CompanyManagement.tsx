import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [companies, setCompanies] = useState<(Company & { addresses: Address })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('all'); // 'all', 'supplier', 'seller'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<(Company & { addresses: Address }) | null>(null);

  // Add New Company Form State
  const [companyName, setCompanyName] = useState('');
  const [companyVat, setCompanyVat] = useState('');
  const [currentCompanyType, setCurrentCompanyType] = useState<'supplier' | 'seller' | null>(null); // Renamed from companyType to avoid conflict
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
      setCompanies(data as (Company & { addresses: Address })[] || []);
    } catch (error: any) {
      toast({ title: 'Error fetching companies', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch addresses for dropdown
  useEffect(() => {
    if (!showAddressForm && (showAddForm || editingCompany)) { // Only fetch if form is active
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
  }, [addressSearch, showAddressForm, showAddForm, editingCompany]);

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
    setCurrentCompanyType(null);
    setSelectedAddressId(undefined);
    setShowAddressForm(false);
    setAddressForm({ addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '', latitude: '', longitude: '' });
    setEditingCompany(null);
  };

  const handleAddOrUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companyVat || !currentCompanyType || !selectedAddressId) {
      toast({ title: 'Errore di validazione', description: 'Compila tutti i campi obbligatori (*).', variant: 'destructive' });
      return;
    }

    const companyData = {
      name: companyName,
      codeVAT: companyVat,
      isSupplier: currentCompanyType === 'supplier',
      isSeller: currentCompanyType === 'seller',
      addressId: selectedAddressId,
      // categoryId is still not handled here, as per previous note.
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
    if (company.isSeller && company.isSupplier) {
      // This case needs clarification if "both" is an option or if one should take precedence.
      // For now, defaulting to 'seller' if both are true, or you might need a combined type.
      // Let's assume for the form, it can be one or the other, or it could be that the DB stores two booleans
      // and the form represents this. The current form allows only one to be selected or null.
      // If the requirement is to select 'supplier' OR 'seller' but not exclusively both via a single form option:
       setCurrentCompanyType(company.isSeller ? 'seller' : 'supplier');
    } else if (company.isSeller) {
      setCurrentCompanyType('seller');
    } else if (company.isSupplier) {
      setCurrentCompanyType('supplier');
    } else {
      setCurrentCompanyType(null);
    }
    setSelectedAddressId(company.addressId);
    if (company.addresses) {
        setAddressSearch(company.addresses.addressLine1 || company.addresses.city);
    }
    setShowAddForm(true);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const searchTermMatch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              company.codeVAT.toLowerCase().includes(searchTerm.toLowerCase());

      const typeMatch = companyTypeFilter === 'all' ||
                        (companyTypeFilter === 'supplier' && company.isSupplier && !company.isSeller) ||
                        (companyTypeFilter === 'seller' && company.isSeller && !company.isSupplier) ||
                        (companyTypeFilter === 'supplierOnly' && company.isSupplier && !company.isSeller) ||
                        (companyTypeFilter === 'sellerOnly' && company.isSeller && !company.isSupplier) ||
                        (companyTypeFilter === 'both' && company.isSeller && company.isSupplier);

      return searchTermMatch && typeMatch;
    });
  }, [companies, searchTerm, companyTypeFilter]);

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
                  <input type="radio" name="companyType" value="supplier" checked={currentCompanyType === 'supplier'} onChange={() => setCurrentCompanyType('supplier')} /> Fornitore
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="companyType" value="seller" checked={currentCompanyType === 'seller'} onChange={() => setCurrentCompanyType('seller')} /> Venditore
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
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle>Aziende</CardTitle>
        <Button onClick={() => { setEditingCompany(null); resetAddCompanyForm(); setShowAddForm(true); }}>Nuova Azienda</Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            placeholder="Cerca per nome o P.IVA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtra per tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="supplierOnly">Solo Fornitori</SelectItem>
              <SelectItem value="sellerOnly">Solo Venditori</SelectItem>
              <SelectItem value="both">Fornitori & Venditori</SelectItem>
            </SelectContent>
          </Select>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => {
                  const address = company.addresses; // No longer need cast due to state type
                  return (
                    <tr key={company.id} onClick={() => handleEdit(company)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.codeVAT}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.isSeller && company.isSupplier ? 'Fornitore & Venditore' : company.isSeller ? 'Venditore' : company.isSupplier ? 'Fornitore' : 'N/A'}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {address ? `${address.addressLine1 || ''}${address.addressLine1 && address.city ? ', ' : ''}${address.city || ''}` : 'N/A'}
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
