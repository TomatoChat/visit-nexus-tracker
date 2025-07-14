import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Pencil, Search, Plus } from 'lucide-react';
import { 
  usePeople, 
  useCompanies, 
  usePersonRoles, 
  useSellingPointsBySeller,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson
} from '@/hooks/use-data';

type Person = Database['public']['Tables']['people']['Row'] & {
  companies: Database['public']['Tables']['companies']['Row'] | null,
  sellingPoints: Database['public']['Tables']['sellingPoints']['Row'] | null,
  personRoles: Database['public']['Tables']['personRoles']['Row'] | null,
};
type Company = Database['public']['Tables']['companies']['Row'];
type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'];
type PersonRole = Database['public']['Tables']['personRoles']['Row'];

interface PersonManagementProps {
  readOnly?: boolean;
  searchTerm?: string;
  triggerAddForm?: boolean;
  onAddFormShown?: () => void;
}

const PersonManagement: React.FC<PersonManagementProps> = ({ readOnly = false, searchTerm = '', triggerAddForm = false, onAddFormShown }) => {
  const { toast } = useToast();
  
  // Form State
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string | undefined>(undefined);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);

  const [isSellingPointDropdownEnabled, setIsSellingPointDropdownEnabled] = useState(false);

  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', isAgent: false, isExternal: false });

  // Data fetching hooks
  const { data: people = [], isLoading, error: peopleError } = usePeople();
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();
  const { data: personRoles = [], isLoading: isLoadingPersonRoles } = usePersonRoles();
  const { data: sellingPoints = [], isLoading: isLoadingSellingPoints } = useSellingPointsBySeller(selectedCompanyId || '');

  // Mutations
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const deletePersonMutation = useDeletePerson();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

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

  useEffect(() => {
    if (triggerAddForm) {
      setShowAddForm(true);
      if (onAddFormShown) onAddFormShown();
    }
  }, [triggerAddForm, onAddFormShown]);

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
      setShowAddForm(false); resetForm();
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

  const handleSoftDelete = async (person: Person) => {
    try {
      const { error } = await supabase
        .from('people')
        .update({ isActive: false })
        .eq('id', person.id);
      
      if (error) throw error;
      
      toast({ title: 'Successo!', description: 'Persona eliminata con successo!' });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || 'Impossibile eliminare la persona.', variant: 'destructive' });
    }
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
        <CardHeader>
          <CardTitle>{editingPerson ? 'Modifica Persona' : 'Crea Nuova Persona'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    <label className="flex items-center gap-2"><input type="checkbox" checked={newRole.isAgent} onChange={e => setNewRole(p => ({ ...p, isAgent: e.target.checked }))} /> Personale Interno</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={newRole.isExternal} onChange={e => setNewRole(p => ({ ...p, isExternal: e.target.checked }))} /> Personale Esterno</label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setShowNewRoleForm(false); setNewRole({ name: '', isAgent: false, isExternal: false }); }}>Annulla</Button>
                    <Button type="button" onClick={handleCreateRole}>Salva Ruolo</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center space-x-2">
              <div>
                {editingPerson && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    aria-label="Elimina"
                    onClick={() => {
                      if (confirm("Sei sicuro di voler eliminare questa persona?")) {
                        handleSoftDelete(editingPerson);
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>Annulla</Button>
                <Button type="submit">{editingPerson ? 'Salva Modifiche' : 'Crea Persona'}</Button>
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
        {isLoading ? (<p>Caricamento...</p>) : (
          <>
            <div className="overflow-x-auto">
                          <table className="w-full divide-border divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider w-1/5">Nome Cognome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider w-1/5">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider w-1/5">Azienda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider w-1/5">P. Vendita</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider w-1/5">Ruolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider w-24">Azioni</th>
                </tr>
              </thead>
                <tbody className="bg-background divide-border divide-gray-200">
                  {filteredPeople.map(person => (
                    <tr key={person.id} onClick={!readOnly ? () => handleEdit(person) : undefined} className={!readOnly ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{`${person.surname} ${person.name}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{person.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{person.companies?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{person.sellingPoints?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{person.personRoles?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {!readOnly && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(person);
                              }}
                              aria-label="Modifica"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Sei sicuro di voler eliminare questa persona?')) {
                                  handleSoftDelete(person);
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
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {filteredPeople.length === 0 && !isLoading && <p>Nessuna persona trovata.</p>}
      </CardContent>
    </Card>
  );
};

export default PersonManagement;
