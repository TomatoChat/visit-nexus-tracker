import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SidebarTrigger } from '@/components/ui/sidebar';
import CompanyManagement from '@/components/data-management/CompanyManagement';
import SellingPointManagement from '@/components/data-management/SellingPointManagement';
import PersonManagement from '@/components/data-management/PersonManagement';
import ActivityManagement from '@/components/data-management/ActivityManagement';

const DataManagement = () => {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <div className="min-h-screen pt-4 md:pt-0">
      <div className="w-full md:max-w-4xl mx-auto px-2 md:px-0 pb-2 md:pb-0 mt-0 lg:mt-8">
        {/* Mobile: Sidebar button and title row */}
        <div className="flex flex-row items-center gap-2 md:hidden mb-4">
          <SidebarTrigger />
          <h1 className="text-lg font-bold text-gray-800">Data Management</h1>
        </div>
        {/* Desktop: Title */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-left">Data Management</h1>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="min-w-max flex gap-2 mb-4">
              <TabsTrigger value="company" className="inline-block">Aziende</TabsTrigger>
              <TabsTrigger value="sellingPoint" className="inline-block">Punti Vendita</TabsTrigger>
              <TabsTrigger value="person" className="inline-block">Persone</TabsTrigger>
              <TabsTrigger value="activity" className="inline-block">Attività</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="company">
            <CompanyManagement />
          </TabsContent>
          <TabsContent value="sellingPoint">
            {/* Replace with actual SellingPointManagement component */}
            <SellingPointManagement />
          </TabsContent>
          <TabsContent value="person">
            {/* Replace with actual PersonManagement component */}
            <PersonManagement />
          </TabsContent>
          <TabsContent value="activity">
            {/* Replace with actual ActivityManagement component */}
            <ActivityManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

type Company = Database['public']['Tables']['companies']['Row'];
type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'];
type PersonRole = Database['public']['Tables']['personRoles']['Row'];

interface Option {
  value: string;
  label: string;
}

// AddNewPersonForm component
const AddNewPersonForm = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);

  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string | undefined>(undefined);
  const [isSellingPointDropdownEnabled, setIsSellingPointDropdownEnabled] = useState(false);

  const [personRoles, setPersonRoles] = useState<PersonRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);

  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingSellingPoints, setIsLoadingSellingPoints] = useState(false);
  const [isLoadingPersonRoles, setIsLoadingPersonRoles] = useState(false);
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);

  // New role form state
  const [newRole, setNewRole] = useState({
    name: '',
    isAgent: false,
    isExternal: false
  });

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching companies:', error);
        toast({ title: 'Error fetching companies', variant: 'destructive' });
      } else {
        setCompanies(data || []);
      }
      setIsLoadingCompanies(false);
    };
    fetchCompanies();
  }, [toast]);

  // Fetch person roles
  useEffect(() => {
    const fetchPersonRoles = async () => {
      setIsLoadingPersonRoles(true);
      const { data, error } = await supabase
        .from('personRoles')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching person roles:', error);
        toast({ title: 'Error fetching person roles', variant: 'destructive' });
      } else {
        setPersonRoles(data || []);
      }
      setIsLoadingPersonRoles(false);
    };
    fetchPersonRoles();
  }, [toast]);

  // Handle company selection logic
  useEffect(() => {
    const company = companies.find(c => c.id === selectedCompanyId);
    setSelectedCompany(company);
    setSelectedSellingPointId(undefined); // Reset selling point when company changes

    if (company && company.isSeller) {
      setIsSellingPointDropdownEnabled(true);
    } else {
      setIsSellingPointDropdownEnabled(false);
    }
  }, [selectedCompanyId, companies]);

  // Fetch selling points when selected company is a seller
  useEffect(() => {
    if (selectedCompany && selectedCompany.isSeller && selectedCompanyId) {
      const fetchSellingPoints = async () => {
        setIsLoadingSellingPoints(true);
        const { data, error } = await supabase
          .from('sellingPoints')
          .select('*')
          .eq('sellerCompanyId', selectedCompanyId)
          .order('name', { ascending: true });
        if (error) {
          console.error('Error fetching selling points:', error);
          toast({ title: 'Error fetching selling points', variant: 'destructive' });
        } else {
          setSellingPoints(data || []);
        }
        setIsLoadingSellingPoints(false);
      };
      fetchSellingPoints();
    } else {
      setSellingPoints([]); // Clear selling points if company is not a seller or no company selected
    }
  }, [selectedCompany, selectedCompanyId, toast]);


  const companyOptions = useMemo(() => companies.map(c => ({ value: c.id, label: c.name })), [companies]);
  const sellingPointOptions = useMemo(() => sellingPoints.map(sp => ({ value: sp.id, label: sp.name })), [sellingPoints]);
  const personRoleOptions = useMemo(() => personRoles.map(pr => ({ value: pr.id, label: pr.name })), [personRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory fields
    if (!name || !surname || !email || !phoneNumber || !selectedCompanyId || !selectedRoleId) {
      toast({
        title: 'Errore di validazione',
        description: 'Per favore compila tutti i campi obbligatori (*).',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newPersonData: Database['public']['Tables']['people']['Insert'] = {
        name,
        surname,
        email,
        phoneNumber,
        companyId: selectedCompanyId,
        roleId: selectedRoleId,
        sellingPointId: selectedSellingPointId || null, // Can be null
      };

      const { error } = await supabase.from('people').insert(newPersonData);

      if (error) {
        throw error;
      }

      toast({
        title: 'Successo!',
        description: 'Persona aggiunta con successo!',
      });

      // Clear form fields
      setName('');
      setSurname('');
      setEmail('');
      setPhoneNumber('');
      setSelectedCompanyId(undefined);
      setSelectedSellingPointId(undefined);
      setSelectedRoleId(undefined);
      // The selectedCompany and selling point dropdown state will reset due to useEffect dependencies

    } catch (error: any) {
      console.error('Error inserting person:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiungere la persona. Riprova.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggiungi Nuova Persona</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="surname">Cognome <span className="text-red-500">*</span></Label>
              <Input id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Telefono <span className="text-red-500">*</span></Label>
              <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label htmlFor="company">Seleziona Azienda <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={companyOptions}
              value={selectedCompanyId}
              onSelect={setSelectedCompanyId}
              placeholder={isLoadingCompanies ? "Caricamento aziende..." : "Seleziona un'azienda"}
              searchPlaceholder="Cerca aziende..."
              disabled={isLoadingCompanies}
            />
          </div>

          <div>
            <Label htmlFor="sellingPoint">Seleziona Punto Vendita</Label>
            <SearchableSelect
              options={sellingPointOptions}
              value={selectedSellingPointId}
              onSelect={setSelectedSellingPointId}
              placeholder={isLoadingSellingPoints ? "Caricamento punti vendita..." : (isSellingPointDropdownEnabled ? "Seleziona un punto vendita" : "N/A - Seleziona prima un'azienda venditrice")}
              searchPlaceholder="Cerca punti vendita..."
              disabled={!isSellingPointDropdownEnabled || isLoadingSellingPoints}
            />
          </div>

          <div>
            <Label htmlFor="role">Seleziona Ruolo <span className="text-red-500">*</span></Label>
            {!showNewRoleForm ? (
              <div className="flex gap-2">
                <SearchableSelect
                  options={personRoleOptions}
                  value={selectedRoleId}
                  onSelect={setSelectedRoleId}
                  placeholder={isLoadingPersonRoles ? "Caricamento ruoli..." : "Seleziona un ruolo"}
                  searchPlaceholder="Cerca ruoli..."
                  disabled={isLoadingPersonRoles}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewRoleForm(true)}
                  className="px-3"
                >
                  +
                </Button>
              </div>
            ) : (
              <div className="space-y-2 border rounded p-2 mt-2">
                <div>
                  <Label htmlFor="role-name">Nome ruolo <span className="text-red-500">*</span></Label>
                  <Input
                    id="role-name"
                    value={newRole.name}
                    onChange={e => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome ruolo"
                    required
                  />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRole.isAgent}
                      onChange={e => setNewRole(prev => ({ ...prev, isAgent: e.target.checked }))}
                    />
                    Agente <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRole.isExternal}
                      onChange={e => setNewRole(prev => ({ ...prev, isExternal: e.target.checked }))}
                    />
                    Esterno <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowNewRoleForm(false);
                    setNewRole({ name: '', isAgent: false, isExternal: false });
                  }}>
                    Annulla
                  </Button>
                  <Button type="button" onClick={async () => {
                    // Validate mandatory fields
                    if (!newRole.name) {
                      toast({
                        title: 'Errore di validazione',
                        description: 'Il nome del ruolo è obbligatorio.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    // Both checkboxes must be set (true or false, but both must be present)
                    if (typeof newRole.isAgent !== 'boolean' || typeof newRole.isExternal !== 'boolean') {
                      toast({
                        title: 'Errore di validazione',
                        description: 'Devi specificare se il ruolo è agente e/o esterno.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    try {
                      const { data, error } = await supabase
                        .from('personRoles')
                        .insert({
                          name: newRole.name,
                          isAgent: newRole.isAgent,
                          isExternal: newRole.isExternal
                        })
                        .select()
                        .single();
                      if (error) throw error;
                      setPersonRoles(prev => [...prev, data]);
                      setSelectedRoleId(data.id);
                      setShowNewRoleForm(false);
                      setNewRole({ name: '', isAgent: false, isExternal: false });
                      toast({
                        title: 'Successo!',
                        description: 'Ruolo creato con successo!',
                      });
                    } catch (error) {
                      console.error('Error creating role:', error);
                      toast({
                        title: 'Errore',
                        description: error.message || 'Impossibile creare il ruolo. Riprova.',
                        variant: 'destructive',
                      });
                    }
                  }}>
                    Salva Ruolo
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              Salva Persona
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// AddNewSellingPointForm component
const AddNewSellingPointForm = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSellerCompanyId, setSelectedSellerCompanyId] = useState<string | undefined>(undefined);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);

  // Address form state for selling point
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

  const [sellerCompanies, setSellerCompanies] = useState<Company[]>([]);
  const [isLoadingSellerCompanies, setIsLoadingSellerCompanies] = useState(false);

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

  // Fetch addresses for search
  useEffect(() => {
    if (!showAddressForm) {
      setAddressLoading(true);
      (async () => {
        try {
          const { data } = await supabase
            .from("addresses")
            .select("id, addressLine1, city")
            .or(`addressLine1.ilike.%${addressSearch}%,city.ilike.%${addressSearch}%`);
          setAddressOptions(
            (data || []).map((a: any) => ({
              value: a.id,
              label: a.addressLine1 || "(No address line)",
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
    
    if (hasMandatoryFields && !hasCoordinates && !isGeocoding) {
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
          // Don't show error toast for auto-geocoding, just leave fields blank
        })
        .finally(() => {
          setIsGeocoding(false);
        });
    }
  }, [addressForm.city, addressForm.stateProvince, addressForm.country, addressForm.addressLine1, addressForm.addressLine2, addressForm.postalCode]);

  const sellerCompanyOptions = useMemo(() => sellerCompanies.map(c => ({ value: c.id, label: c.name })), [sellerCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory fields
    if (!name || !selectedSellerCompanyId || !selectedAddressId) {
      toast({
        title: 'Errore di validazione',
        description: 'Per favore compila tutti i campi obbligatori (*).',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newSellingPointData: Database['public']['Tables']['sellingPoints']['Insert'] = {
        name,
        phoneNumber: phoneNumber || null,
        sellerCompanyId: selectedSellerCompanyId,
        addressId: selectedAddressId,
      };

      const { error } = await supabase.from('sellingPoints').insert(newSellingPointData);

      if (error) {
        throw error;
      }

      toast({
        title: 'Successo!',
        description: 'Punto vendita aggiunto con successo!',
      });

      // Clear form fields
      setName('');
      setPhoneNumber('');
      setSelectedSellerCompanyId(undefined);
      setSelectedAddressId(undefined);

    } catch (error: any) {
      console.error('Error inserting selling point:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiungere il punto vendita. Riprova.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuovo Punto Vendita</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="selling-point-name">Nome Punto Vendita <span className="text-red-500">*</span></Label>
            <Input id="selling-point-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Inserisci il nome del punto vendita" required />
          </div>
          <div>
            <Label htmlFor="selling-point-phone">Telefono</Label>
            <Input id="selling-point-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Inserisci il numero di telefono" />
          </div>
          <div>
            <Label htmlFor="seller-company">Azienda Venditrice <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={sellerCompanyOptions}
              value={selectedSellerCompanyId}
              onSelect={setSelectedSellerCompanyId}
              placeholder={isLoadingSellerCompanies ? "Caricamento aziende venditrici..." : "Seleziona un'azienda venditrice"}
              searchPlaceholder="Cerca aziende venditrici..."
              disabled={isLoadingSellerCompanies}
            />
          </div>
          <div>
            <Label>Indirizzo <span className="text-red-500">*</span></Label>
            {!showAddressForm ? (
              <div className="flex gap-2">
                <SearchableSelect
                  options={addressOptions}
                  value={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  placeholder="Cerca indirizzo per via o città..."
                  searchPlaceholder="Digita indirizzo o città..."
                  disabled={addressLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddressForm(true)}
                  className="px-3"
                >
                  +
                </Button>
              </div>
            ) : (
              <div className="space-y-2 border rounded p-2 mt-2">
                <div>
                  <Label htmlFor="sp-address-line1">Via</Label>
                  <Input
                    id="sp-address-line1"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                    placeholder="Via"
                  />
                </div>
                <div>
                  <Label htmlFor="sp-address-line2">Civico</Label>
                  <Input
                    id="sp-address-line2"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                    placeholder="Civico"
                  />
                </div>
                <div>
                  <Label htmlFor="sp-address-city">Città <span className="text-red-500">*</span></Label>
                  <Input
                    id="sp-address-city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Città"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sp-address-state">Provincia <span className="text-red-500">*</span></Label>
                  <Input
                    id="sp-address-state"
                    value={addressForm.stateProvince}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, stateProvince: e.target.value }))}
                    placeholder="Provincia"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sp-address-postal">CAP</Label>
                  <Input
                    id="sp-address-postal"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="CAP"
                  />
                </div>
                <div>
                  <Label htmlFor="sp-address-country">Nazione <span className="text-red-500">*</span></Label>
                  <Input
                    id="sp-address-country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Nazione"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="sp-address-lat">Latitudine <span className="text-red-500">*</span></Label>
                    <Input
                      id="sp-address-lat"
                      type="number"
                      step="any"
                      value={addressForm.latitude}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder={isGeocoding ? "Caricamento..." : "Latitudine"}
                      required
                      disabled={isGeocoding}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="sp-address-lng">Longitudine <span className="text-red-500">*</span></Label>
                    <Input
                      id="sp-address-lng"
                      type="number"
                      step="any"
                      value={addressForm.longitude}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder={isGeocoding ? "Caricamento..." : "Longitudine"}
                      required
                      disabled={isGeocoding}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddressForm(false);
                      setAddressForm({
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        stateProvince: '',
                        postalCode: '',
                        country: '',
                        latitude: '',
                        longitude: ''
                      });
                      setIsGeocoding(false);
                    }}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    disabled={isGeocoding}
                    onClick={async () => {
                      // Validate mandatory fields
                      if (!addressForm.city || !addressForm.stateProvince || !addressForm.country) {
                        toast({
                          title: 'Errore di validazione',
                          description: 'Per favore compila tutti i campi obbligatori (*).',
                          variant: 'destructive',
                        });
                        return;
                      }
                      let latitude = addressForm.latitude;
                      let longitude = addressForm.longitude;
                      // If latitude or longitude are empty, try to geocode
                      if (!latitude || !longitude) {
                        try {
                          const { lat, lng } = await geocodeAddress({
                            addressLine1: addressForm.addressLine1,
                            city: addressForm.city,
                            stateProvince: addressForm.stateProvince,
                            country: addressForm.country,
                            postalCode: addressForm.postalCode,
                          }, import.meta.env.VITE_GOOGLE_MAPS_KEY);
                          latitude = lat.toString();
                          longitude = lng.toString();
                        } catch (err) {
                          toast({
                            title: 'Errore geocoding',
                            description: err.message || 'Impossibile ottenere latitudine e longitudine automaticamente.',
                            variant: 'destructive',
                          });
                          return;
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
                        setAddressForm({
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          stateProvince: '',
                          postalCode: '',
                          country: '',
                          latitude: '',
                          longitude: ''
                        });
                        setIsGeocoding(false);
                        toast({
                          title: 'Successo!',
                          description: 'Indirizzo creato con successo!',
                        });
                      } catch (error) {
                        console.error('Error creating address:', error);
                        toast({
                          title: 'Errore',
                          description: error.message || 'Impossibile creare l\'indirizzo. Riprova.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    {isGeocoding ? 'Caricamento...' : 'Salva Indirizzo'}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit">Crea Punto Vendita</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// AddNewActivityForm component
const AddNewActivityForm = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Errore di validazione',
        description: 'Il nome dell\'attività è obbligatorio.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('visitActivities').insert({ name });
      if (error) throw error;
      toast({
        title: 'Successo!',
        description: 'Attività aggiunta con successo!',
      });
      setName('');
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiungere l\'attività. Riprova.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuova Attività</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="activity-name">Nome Attività <span className="text-red-500">*</span></Label>
            <Input
              id="activity-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Inserisci il nome dell'attività"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvataggio...' : 'Crea Attività'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DataManagement;
