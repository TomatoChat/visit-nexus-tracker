import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Pencil, Search, Plus } from 'lucide-react';

type Activity = Database['public']['Tables']['visitActivities']['Row'];

interface ActivityManagementProps {
  // Props will be added later if needed
}

const ActivityManagement: React.FC<ActivityManagementProps> = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Add New/Edit Form State
  const [name, setName] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);


  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitActivities')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast({ title: 'Error fetching activities', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const resetForm = () => {
    setName('');
    setEditingActivity(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Errore di validazione', description: 'Il nome dell\'attività è obbligatorio.', variant: 'destructive' });
      return;
    }
    setFormLoading(true);

    const activityData = { name: name.trim() };

    try {
      let error;
      if (editingActivity) {
        const { error: updateError } = await supabase
          .from('visitActivities')
          .update(activityData)
          .eq('id', editingActivity.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('visitActivities')
          .insert(activityData);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: 'Successo!', description: `Attività ${editingActivity ? 'aggiornata' : 'creata'} con successo!` });
      setShowAddForm(false);
      resetForm();
      fetchActivities(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || `Impossibile ${editingActivity ? 'aggiornare' : 'creare'} l'attività.`, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setName(activity.name);
    setShowAddForm(true);
  };

  const handleSoftDelete = async (activity: Activity) => {
    try {
      const { error } = await supabase
        .from('visitActivities')
        .delete()
        .eq('id', activity.id);
      if (error) throw error;
      toast({ title: 'Successo!', description: 'Attività eliminata con successo!' });
      fetchActivities();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || 'Impossibile eliminare l\'attività.', variant: 'destructive' });
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(activity =>
      activity.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activities, searchTerm]);

  if (showAddForm || editingActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingActivity ? 'Modifica Attività' : 'Nuova Attività'}</CardTitle>
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
            <div className="flex justify-between items-center space-x-2">
              <div>
                {editingActivity && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    aria-label="Elimina"
                    onClick={() => {
                      if (confirm("Sei sicuro di voler eliminare questa attività?")) {
                        handleSoftDelete(editingActivity);
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }} disabled={formLoading}>
                  Annulla
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Salvataggio...' : (editingActivity ? 'Salva Modifiche' : 'Crea Attività')}
                </Button>
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
          <CardTitle>Attività</CardTitle>
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
              placeholder="Cerca per nome attività..."
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
          onClick={() => { setEditingActivity(null); resetForm(); setShowAddForm(true); }}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Caricamento attività...</p>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {activities.length} attività
            </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} onClick={() => handleEdit(activity)} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            handleEdit(activity);
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
                            if (confirm('Sei sicuro di voler eliminare questa attività?')) {
                              handleSoftDelete(activity);
                            }
                          }}
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
          </>
        )}
        {filteredActivities.length === 0 && !isLoading && <p>Nessuna attività trovata.</p>}
      </CardContent>
    </Card>
  );
};

export default ActivityManagement;
