
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type VisitActivity = Database['public']['Tables']['visitActivities']['Row'];

interface ActivitySelectorProps {
  selectedActivityId?: string;
  onSelect: (activityId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
  selectedActivityId,
  onSelect,
  onNext,
  onBack
}) => {
  const [activities, setActivities] = useState<VisitActivity[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (activityId: string) => {
    onSelect(activityId);
  };

  const canProceed = selectedActivityId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Select Visit Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading activities...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedActivityId === activity.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelect(activity.id)}
              >
                <h3 className="font-medium text-center">{activity.name}</h3>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!canProceed}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
