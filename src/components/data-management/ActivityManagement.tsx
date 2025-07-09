import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }} disabled={formLoading}>
                Annulla
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Salvataggio...' : (editingActivity ? 'Salva Modifiche' : 'Crea Attività')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attività</CardTitle>
        <Button onClick={() => { setEditingActivity(null); resetForm(); setShowAddForm(true); }}>Nuova Attività</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Cerca per nome attività..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isLoading ? (
          <p>Caricamento attività...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                    <tr key={activity.id} onClick={() => handleEdit(activity)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.name}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredActivities.length === 0 && !isLoading && <p>Nessuna attività trovata.</p>}
      </CardContent>
    </Card>
  );
};

export default ActivityManagement;
