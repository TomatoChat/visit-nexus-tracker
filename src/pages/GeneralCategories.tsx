import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActivities, usePersonRoles, useCompanyCategories } from '@/hooks/use-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Activity, PersonRole, CompanyCategory } from '@/hooks/use-data';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/table-skeleton';

const GeneralCategories = () => {
  const { userRole, loading, checkCanManageData } = useRoles();
  const { toast } = useToast();
  const [tab, setTab] = useState('activities');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState<any>({});
  const [modalTab, setModalTab] = useState('activities');
  
  // Search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const activitiesQuery = useActivities();
  const rolesQuery = usePersonRoles();
  const categoriesQuery = useCompanyCategories();
  const queryClient = useQueryClient();

  // Mutations for activities
  const createActivity = useMutation({
    mutationFn: async (data: { name: string }) => {
      const { error } = await supabase.from('visitActivities').insert({ name: data.name, isactive: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Successo!', description: 'Attività creata con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile creare l\'attività.', variant: 'destructive' });
    }
  });
  const updateActivity = useMutation({
    mutationFn: async (data: Activity) => {
      const { error } = await supabase.from('visitActivities').update({ name: data.name }).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Successo!', description: 'Attività aggiornata con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile aggiornare l\'attività.', variant: 'destructive' });
    }
  });
  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('visitActivities').update({ isactive: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Successo!', description: 'Attività eliminata con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile eliminare l\'attività.', variant: 'destructive' });
    }
  });

  // Mutations for roles
  const createRole = useMutation({
    mutationFn: async (data: { name: string; isAgent: boolean; isExternal: boolean }) => {
      const { error } = await supabase.from('personRoles').insert({ ...data, isactive: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personRoles'] });
      toast({ title: 'Successo!', description: 'Ruolo creato con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile creare il ruolo.', variant: 'destructive' });
    }
  });
  const updateRole = useMutation({
    mutationFn: async (data: PersonRole) => {
      const { error } = await supabase.from('personRoles').update({ name: data.name, isAgent: data.isAgent, isExternal: data.isExternal }).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personRoles'] });
      toast({ title: 'Successo!', description: 'Ruolo aggiornato con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile aggiornare il ruolo.', variant: 'destructive' });
    }
  });
  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personRoles').update({ isactive: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personRoles'] });
      toast({ title: 'Successo!', description: 'Ruolo eliminato con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile eliminare il ruolo.', variant: 'destructive' });
    }
  });

  // Mutations for categories
  const createCategory = useMutation({
    mutationFn: async (data: { name: string; supplierCategory: boolean; sellerCategory: boolean }) => {
      console.log('Creating category with data:', data);
      const { error } = await supabase.from('companyCategories').insert({ ...data, isactive: true });
      console.log('Supabase response error:', error);
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['companyCategories'] });
      toast({ title: 'Successo!', description: 'Categoria creata con successo!' });
    },
    onError: (error: any) => {
      console.log('Category creation error:', error);
      toast({ title: 'Errore', description: error.message || 'Impossibile creare la categoria.', variant: 'destructive' });
    }
  });
  const updateCategory = useMutation({
    mutationFn: async (data: CompanyCategory) => {
      const { error } = await supabase.from('companyCategories').update({ name: data.name, supplierCategory: data.supplierCategory, sellerCategory: data.sellerCategory }).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyCategories'] });
      toast({ title: 'Successo!', description: 'Categoria aggiornata con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile aggiornare la categoria.', variant: 'destructive' });
    }
  });
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('companyCategories').update({ isactive: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyCategories'] });
      toast({ title: 'Successo!', description: 'Categoria eliminata con successo!' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message || 'Impossibile eliminare la categoria.', variant: 'destructive' });
    }
  });

  React.useEffect(() => {
    const verifyPermissions = async () => {
      const result = await checkCanManageData();
      setCanManage(result);
    };
    verifyPermissions();
  }, [checkCanManageData]);

  if (loading) {
    return <Layout><div className="min-h-screen flex items-center justify-center">Loading...</div></Layout>;
  }
  if (!userRole || userRole === 'guest' || userRole === 'externalAgent' || !canManage) {
    return <Layout><div className="min-h-screen flex items-center justify-center text-red-600">Access Denied</div></Layout>;
  }

  return (
    <Layout>
      <div className="w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button, title, and actions */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold">Categorie Generali</h1>
          </div>
          <div className="flex items-center gap-2">
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
                className="w-32"
                placeholder="Cerca..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="border-black text-black hover:bg-gray-50"
              onClick={() => { setEditItem(null); setForm({}); setShowAddModal(true); setModalTab(tab as 'activities'|'roles'|'categories'); }}
              aria-label="Aggiungi"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {/* Desktop: Title and actions */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-left">Categorie Generali</h1>
          <div className="flex items-center gap-2">
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
                className="w-48"
                placeholder="Cerca categorie..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="border-black text-black hover:bg-gray-50"
              onClick={() => { setEditItem(null); setForm({}); setShowAddModal(true); setModalTab(tab as 'activities'|'roles'|'categories'); }}
              aria-label="Aggiungi"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full content-visibility-auto">
          <TabsList className="overflow-hidden rounded-md">
            <TabsTrigger value="activities">Attività</TabsTrigger>
            <TabsTrigger value="roles">Ruoli Persona</TabsTrigger>
            <TabsTrigger value="categories">Categorie Azienda</TabsTrigger>
          </TabsList>
          <TabsContent value="activities">
            {activitiesQuery.isLoading ? <TableSkeleton rows={5} columns={2} /> : activitiesQuery.isError ? <div className="text-red-600">Errore: {String(activitiesQuery.error)}</div> : (
              <Card className="overflow-x-hidden">
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {activitiesQuery.data?.map((a: Activity) => (
                          <tr key={a.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{a.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditItem(a); setForm({ name: a.name }); setShowAddModal(true); setModalTab('activities'); }}
                                  aria-label="Modifica"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteActivity.mutate(a.id)}
                                  aria-label="Elimina"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {activitiesQuery.data?.length === 0 && <p>Nessuna attività trovata.</p>}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="roles">
            {rolesQuery.isLoading ? <TableSkeleton rows={5} columns={4} /> : rolesQuery.isError ? <div className="text-red-600">Errore: {String(rolesQuery.error)}</div> : (
              <Card className="overflow-x-hidden">
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Personale Interno</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Personale Esterno</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {rolesQuery.data?.map((r: PersonRole) => (
                          <tr key={r.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{r.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {r.isAgent ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Sì
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {r.isExternal ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Sì
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditItem(r); setForm({ name: r.name, isAgent: r.isAgent, isExternal: r.isExternal }); setShowAddModal(true); setModalTab('roles'); }}
                                  aria-label="Modifica"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteRole.mutate(r.id)}
                                  aria-label="Elimina"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rolesQuery.data?.length === 0 && <p>Nessun ruolo trovato.</p>}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="categories">
            {categoriesQuery.isLoading ? <TableSkeleton rows={5} columns={4} /> : categoriesQuery.isError ? <div className="text-red-600">Errore: {String(categoriesQuery.error)}</div> : (
              <Card className="overflow-x-hidden">
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fornitore</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {categoriesQuery.data?.map((c: CompanyCategory) => (
                          <tr key={c.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {c.supplierCategory ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Sì
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {c.sellerCategory ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Sì
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditItem(c); setForm({ name: c.name, supplierCategory: c.supplierCategory, sellerCategory: c.sellerCategory }); setShowAddModal(true); setModalTab('categories'); }}
                                  aria-label="Modifica"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteCategory.mutate(c.id)}
                                  aria-label="Elimina"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {categoriesQuery.data?.length === 0 && <p>Nessuna categoria trovata.</p>}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Modal for add/edit */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogTitle>{editItem ? 'Modifica' : 'Aggiungi'} {modalTab === 'activities' ? 'Attività' : modalTab === 'roles' ? 'Ruolo Persona' : modalTab === 'categories' ? 'Categoria Azienda' : ''}</DialogTitle>
            {modalTab === 'activities' && (
              <Input placeholder="Nome attività" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            )}
            {modalTab === 'roles' && (
              <>
                <Input placeholder="Nome ruolo" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium">Personale Interno</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.isAgent ? 'default' : 'outline'}
                      onClick={() => setForm(f => ({ ...f, isAgent: true }))}
                    >
                      Sì
                    </Button>
                    <Button
                      type="button"
                      variant={!form.isAgent ? 'default' : 'outline'}
                      onClick={() => setForm(f => ({ ...f, isAgent: false }))}
                    >
                      No
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium">Personale Esterno</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.isExternal ? 'default' : 'outline'}
                      onClick={() => setForm(f => ({ ...f, isExternal: true }))}
                    >
                      Sì
                    </Button>
                    <Button
                      type="button"
                      variant={!form.isExternal ? 'default' : 'outline'}
                      onClick={() => setForm(f => ({ ...f, isExternal: false }))}
                    >
                      No
                    </Button>
                  </div>
                </div>
              </>
            )}
            {modalTab === 'categories' && (
              <>
                <Input placeholder="Nome categoria" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <div className="flex gap-8 mt-4 items-center">
                  <div className="flex flex-col items-center gap-2 font-medium">
                    <span>Fornitore</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={form.supplierCategory ? 'default' : 'outline'}
                        onClick={() => setForm(f => ({ ...f, supplierCategory: true }))}
                      >
                        Sì
                      </Button>
                      <Button
                        type="button"
                        variant={!form.supplierCategory ? 'default' : 'outline'}
                        onClick={() => setForm(f => ({ ...f, supplierCategory: false }))}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 font-medium">
                    <span>Cliente</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={form.sellerCategory ? 'default' : 'outline'}
                        onClick={() => setForm(f => ({ ...f, sellerCategory: true }))}
                      >
                        Sì
                      </Button>
                      <Button
                        type="button"
                        variant={!form.sellerCategory ? 'default' : 'outline'}
                        onClick={() => setForm(f => ({ ...f, sellerCategory: false }))}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Annulla</Button>
              <Button onClick={() => {
                // Validation
                if (modalTab === 'activities') {
                  if (!form.name || form.name.trim() === '') {
                    toast({ title: 'Errore', description: 'Il nome dell\'attività è obbligatorio.', variant: 'destructive' });
                    return;
                  }
                  if (editItem) updateActivity.mutate({ ...editItem, ...form });
                  else createActivity.mutate(form);
                } else if (modalTab === 'roles') {
                  if (!form.name || form.name.trim() === '') {
                    toast({ title: 'Errore', description: 'Il nome del ruolo è obbligatorio.', variant: 'destructive' });
                    return;
                  }
                  if (editItem) updateRole.mutate({ ...editItem, ...form });
                  else createRole.mutate(form);
                } else if (modalTab === 'categories') {
                  console.log('Submitting category form:', form, 'editItem:', editItem);
                  if (!form.name || form.name.trim() === '') {
                    toast({ title: 'Errore', description: 'Il nome della categoria è obbligatorio.', variant: 'destructive' });
                    return;
                  }
                  if (!form.supplierCategory && !form.sellerCategory) {
                    toast({ title: 'Errore', description: 'Seleziona almeno un tipo (Fornitore o Cliente).', variant: 'destructive' });
                    return;
                  }
                  const payload = {
                    ...form,
                    supplierCategory: !!form.supplierCategory,
                    sellerCategory: !!form.sellerCategory,
                  };
                  if (editItem) {
                    console.log('Updating category:', { ...editItem, ...payload });
                    updateCategory.mutate({ ...editItem, ...payload });
                  } else {
                    console.log('Creating category:', payload);
                    createCategory.mutate(payload);
                  }
                }
                setShowAddModal(false);
              }}>{editItem ? 'Salva' : 'Crea'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GeneralCategories; 