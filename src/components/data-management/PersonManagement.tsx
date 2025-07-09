import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Person = Database['public']['Tables']['people']['Row'] & {
  companies: Database['public']['Tables']['companies']['Row'] | null,
  sellingPoints: Database['public']['Tables']['sellingPoints']['Row'] | null,
  personRoles: Database['public']['Tables']['personRoles']['Row'] | null,
};
type Company = Database['public']['Tables']['companies']['Row'];
type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'];
type PersonRole = Database['public']['Tables']['personRoles']['Row'];

interface PersonManagementProps {}

const PersonManagement: React.FC<PersonManagementProps> = () => {
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string | undefined>(undefined);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [personRoles, setPersonRoles] = useState<PersonRole[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingSellingPoints, setIsLoadingSellingPoints] = useState(false);
  const [isLoadingPersonRoles, setIsLoadingPersonRoles] = useState(false);
  const [isSellingPointDropdownEnabled, setIsSellingPointDropdownEnabled] = useState(false);

  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', isAgent: false, isExternal: false });


  const fetchPeople = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          companies (*),
          sellingPoints (*),
          personRoles (*)
        `)
        .order('surname', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setPeople(data as Person[] || []);
    } catch (error: any) {
      toast({ title: 'Error fetching people', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
      if (error) toast({ title: 'Error fetching companies', variant: 'destructive' });
      else setCompanies(data || []);
      setIsLoadingCompanies(false);
    };
    fetchCompanies();
  }, [toast]);

  // Fetch person roles
  useEffect(() => {
    const fetchPersonRoles = async () => {
      setIsLoadingPersonRoles(true);
      const { data, error } = await supabase.from('personRoles').select('*').order('name', { ascending: true });
      if (error) toast({ title: 'Error fetching person roles', variant: 'destructive' });
      else setPersonRoles(data || []);
      setIsLoadingPersonRoles(false);
    };
    fetchPersonRoles();
  }, [toast]);

  // Handle company selection logic for selling points
  useEffect(() => {
    const company = companies.find(c => c.id === selectedCompanyId);
    setSelectedSellingPointId(undefined); // Reset selling point when company changes
    if (company?.isSeller) {
      setIsSellingPointDropdownEnabled(true);
    } else {
      setIsSellingPointDropdownEnabled(false);
    }
  }, [selectedCompanyId, companies]);

  // Fetch selling points when selected company is a seller
  useEffect(() => {
    if (selectedCompanyId && isSellingPointDropdownEnabled) {
      const fetchSellingPoints = async () => {
        setIsLoadingSellingPoints(true);
        const { data, error } = await supabase.from('sellingPoints').select('*').eq('sellerCompanyId', selectedCompanyId).order('name', { ascending: true });
        if (error) toast({ title: 'Error fetching selling points', variant: 'destructive' });
        else setSellingPoints(data || []);
        setIsLoadingSellingPoints(false);
      };
      fetchSellingPoints();
    } else {
      setSellingPoints([]);
    }
  }, [selectedCompanyId, isSellingPointDropdownEnabled, toast]);

  const companyOptions = useMemo(() => companies.map(c => ({ value: c.id, label: c.name })), [companies]);
  const sellingPointOptions = useMemo(() => sellingPoints.map(sp => ({ value: sp.id, label: sp.name })), [sellingPoints]);
  const personRoleOptions = useMemo(() => personRoles.map(pr => ({ value: pr.id, label: pr.name })), [personRoles]);

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast({ title: 'Errore validazione', description: 'Nome ruolo obbligatorio.', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase.from('personRoles').insert(newRole).select().single();
      if (error) throw error;
      setPersonRoles(prev => [...prev, data]);
      setSelectedRoleId(data.id);
      setShowNewRoleForm(false);
      setNewRole({ name: '', isAgent: false, isExternal: false });
      toast({ title: 'Successo!', description: 'Ruolo creato!' });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || 'Impossibile creare ruolo.', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setName(''); setSurname(''); setEmail(''); setPhoneNumber('');
    setSelectedCompanyId(undefined); setSelectedSellingPointId(undefined); setSelectedRoleId(undefined);
    setEditingPerson(null);
    setShowNewRoleForm(false); setNewRole({ name: '', isAgent: false, isExternal: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !surname || !email || !phoneNumber || !selectedCompanyId || !selectedRoleId) {
      toast({ title: 'Errore validazione', description: 'Compila tutti i campi obbligatori (*).', variant: 'destructive' });
      return;
    }
    const personData: Database['public']['Tables']['people']['Insert'] = {
      name, surname, email, phoneNumber, companyId: selectedCompanyId, roleId: selectedRoleId,
      sellingPointId: selectedSellingPointId || null,
    };
    try {
      let error;
      if (editingPerson) {
        const { error: uError } = await supabase.from('people').update(personData).eq('id', editingPerson.id);
        error = uError;
      } else {
        const { error: iError } = await supabase.from('people').insert(personData);
        error = iError;
      }
      if (error) throw error;
      toast({ title: 'Successo!', description: `Persona ${editingPerson ? 'aggiornata' : 'creata'}!` });
      setShowAddForm(false); resetForm(); fetchPeople();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || `Impossibile ${editingPerson ? 'aggiornare' : 'creare'} persona.`, variant: 'destructive' });
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setName(person.name); setSurname(person.surname); setEmail(person.email); setPhoneNumber(person.phoneNumber);
    setSelectedCompanyId(person.companyId);
    // setSelectedSellingPointId might need a delay if company change triggers its reset/fetch
    // Trigger useEffect for selling points by setting company first
    setTimeout(() => setSelectedSellingPointId(person.sellingPointId || undefined), 0);
    setSelectedRoleId(person.roleId);
    setShowAddForm(true);
  };

  const filteredPeople = useMemo(() => {
    return people.filter(p =>
      `${p.name} ${p.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companies?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [people, searchTerm]);

  if (showAddForm || editingPerson) {
    return (
      <Card>
        <CardHeader><CardTitle>{editingPerson ? 'Modifica Persona' : 'Nuova Persona'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="name">Nome <span className="text-red-500">*</span></Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div><Label htmlFor="surname">Cognome <span className="text-red-500">*</span></Label><Input id="surname" value={surname} onChange={e => setSurname(e.target.value)} required /></div>
              <div><Label htmlFor="email">Email <span className="text-red-500">*</span></Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div><Label htmlFor="phoneNumber">Telefono <span className="text-red-500">*</span></Label><Input id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required /></div>
            </div>
            <div><Label htmlFor="company">Azienda <span className="text-red-500">*</span></Label><SearchableSelect options={companyOptions} value={selectedCompanyId} onSelect={setSelectedCompanyId} placeholder={isLoadingCompanies ? "Caricamento..." : "Seleziona azienda"} disabled={isLoadingCompanies} /></div>
            <div><Label htmlFor="sellingPoint">Punto Vendita</Label><SearchableSelect options={sellingPointOptions} value={selectedSellingPointId} onSelect={setSelectedSellingPointId} placeholder={isLoadingSellingPoints ? "Caricamento..." : (isSellingPointDropdownEnabled ? "Seleziona punto vendita" : "N/A")} disabled={!isSellingPointDropdownEnabled || isLoadingSellingPoints} /></div>
            <div>
              <Label htmlFor="role">Ruolo <span className="text-red-500">*</span></Label>
              {!showNewRoleForm ? (
                <div className="flex gap-2">
                  <SearchableSelect options={personRoleOptions} value={selectedRoleId} onSelect={setSelectedRoleId} placeholder={isLoadingPersonRoles ? "Caricamento..." : "Seleziona ruolo"} disabled={isLoadingPersonRoles} className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => setShowNewRoleForm(true)} className="px-3">+</Button>
                </div>
              ) : (
                <div className="space-y-2 border rounded p-2 mt-2">
                  <div><Label htmlFor="role-name">Nome ruolo <span className="text-red-500">*</span></Label><Input id="role-name" value={newRole.name} onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={newRole.isAgent} onChange={e => setNewRole(p => ({ ...p, isAgent: e.target.checked }))} /> Agente</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={newRole.isExternal} onChange={e => setNewRole(p => ({ ...p, isExternal: e.target.checked }))} /> Esterno</label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setShowNewRoleForm(false); setNewRole({ name: '', isAgent: false, isExternal: false }); }}>Annulla</Button>
                    <Button type="button" onClick={handleCreateRole}>Salva Ruolo</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>Annulla</Button>
              <Button type="submit">{editingPerson ? 'Salva Modifiche' : 'Salva Persona'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Persone</CardTitle>
        <Button onClick={() => { setEditingPerson(null); resetForm(); setShowAddForm(true); }}>Nuova Persona</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4"><Input placeholder="Cerca per nome, email, azienda..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        {isLoading ? (<p>Caricamento...</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Cognome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azienda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Vendita</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPeople.map(person => (
                  <tr key={person.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`${person.surname} ${person.name}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.companies?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.sellingPoints?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.personRoles?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="link" onClick={() => handleEdit(person)}>Modifica</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredPeople.length === 0 && !isLoading && <p>Nessuna persona trovata.</p>}
      </CardContent>
    </Card>
  );
};

export default PersonManagement;
