import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Building, Store, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type EntityType = 'person' | 'seller' | 'supplier' | 'sellingPoint';

const DataManagement = () => {
  const navigate = useNavigate();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [companyType, setCompanyType] = useState<'supplier' | 'seller' | null>(null);

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

  return (
    <div className="min-h-screen p-4">
      <div className="w-full md:max-w-4xl mx-auto px-2 md:px-0 mt-8">
        {/* Mobile: Title */}
        <div className="flex flex-row items-center gap-2 md:hidden mb-4">
          <h1 className="text-lg font-bold text-gray-800">Data Management</h1>
        </div>
        {/* Desktop: Title */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-left">Data Management</h1>
        </div>
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="mb-4 gap-2">
            <TabsTrigger value="company">Nuova Azienda</TabsTrigger>
            <TabsTrigger value="sellingPoint">Nuovo Punto Vendita</TabsTrigger>
            <TabsTrigger value="person">Nuova Persona</TabsTrigger>
            <TabsTrigger value="activity">Nuova Attività</TabsTrigger>
          </TabsList>
          <TabsContent value="company">
        <Card>
          <CardHeader>
                <CardTitle>Crea Nuova Azienda</CardTitle>
          </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Nome Azienda <span className="text-red-500">*</span></Label>
                    <Input id="company-name" placeholder="Inserisci il nome dell'azienda" required />
                  </div>
                  <div>
                    <Label htmlFor="company-vat">Partita IVA <span className="text-red-500">*</span></Label>
                    <Input id="company-vat" placeholder="Inserisci la partita IVA" required />
                  </div>
                  <div>
                    <Label>Tipo Azienda <span className="text-red-500">*</span></Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={companyType === 'supplier'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompanyType('supplier');
                            } else {
                              setCompanyType(null);
                            }
                          }}
                        /> 
                        Fornitore
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={companyType === 'seller'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompanyType('seller');
                            } else {
                              setCompanyType(null);
                            }
                          }}
                        /> 
                        Venditore
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Indirizzo <span className="text-red-500">*</span></Label>
                    {!showAddressForm ? (
                      <div className="flex gap-2">
                        <SearchableSelect
                          options={addressOptions}
                          value={selectedAddress}
                          onSelect={(val) => {
                            setSelectedAddress(val);
                          }}
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
                        <Input placeholder="Via" />
                        <Input placeholder="Civico" />
                        <Input placeholder="Città" />
                        <Input placeholder="Provincia" />
                        <Input placeholder="CAP" />
                        <Input placeholder="Nazione" />
                        <div className="flex gap-2">
                          <Input placeholder="Latitudine" />
                          <Input placeholder="Longitudine" />
                        </div>
                        <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>
                          Annulla
            </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Crea Azienda</Button>
                  </div>
                </form>
          </CardContent>
        </Card>
          </TabsContent>
          <TabsContent value="sellingPoint">
            <AddNewSellingPointForm />
          </TabsContent>
          <TabsContent value="person">
            <AddNewPersonForm />
          </TabsContent>
          <TabsContent value="activity">
            <AddNewActivityForm />
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
                <Input placeholder="Nome ruolo" />
                <Button type="button" variant="outline" onClick={() => setShowNewRoleForm(false)}>
                  Annulla
                </Button>
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
                <Input placeholder="Via" />
                <Input placeholder="Civico" />
                <Input placeholder="Città" />
                <Input placeholder="Provincia" />
                <Input placeholder="CAP" />
                <Input placeholder="Nazione" />
                <div className="flex gap-2">
                  <Input placeholder="Latitudine" />
                  <Input placeholder="Longitudine" />
                </div>
                <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>
                  Annulla
                </Button>
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
