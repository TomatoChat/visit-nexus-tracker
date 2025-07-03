import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Plus, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type VisitActivity = Database['public']['Tables']['visitActivities']['Row'];

const ActivityManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<VisitActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitActivities')
        .select('*')
        .order('name');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async () => {
    if (!newActivityName.trim()) return;
    
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('visitActivities')
        .insert([{ name: newActivityName.trim() }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity added successfully"
      });

      setNewActivityName('');
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('visitActivities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity deleted successfully"
      });

      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive"
      });
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Activity Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Visit Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter new activity name..."
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addActivity()}
              />
              <Button onClick={addActivity} disabled={isAdding || !newActivityName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Loading activities...</div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{activity.name}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this activity?')) {
                            deleteActivity(activity.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityManagement;
