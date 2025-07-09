import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Person = Database['public']['Tables']['people']['Row'] & {
  personRoles: Database['public']['Tables']['personRoles']['Row'];
};

interface PersonSelectorProps {
  sellingPointId: string;
  selectedPersonId?: string;
  onSelect: (personId?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({
  sellingPointId,
  selectedPersonId,
  onSelect,
  onNext,
  onBack
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeople();
  }, [sellingPointId]);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          personRoles (*)
        `)
        .eq('sellingPointId', sellingPointId)
        .eq('personRoles.isAgent', false);

      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (personId: string) => {
    if (selectedPersonId === personId) {
      onSelect(undefined); // Deselect if already selected
    } else {
      onSelect(personId);
    }
  };

  const handleSkip = () => {
    onSelect(undefined);
    onNext();
  };

  const sortedPeople = people.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card className="pt-[2%]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Select Person Visited (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading contacts...</span>
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No contacts available at this selling point
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sortedPeople.map((person) => (
              <div
                key={person.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPersonId === person.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelect(person.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{person.name} {person.surname}</h3>
                    <Badge variant="secondary">{person.personRoles?.name}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      {person.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {person.phoneNumber}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedPersonId}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
