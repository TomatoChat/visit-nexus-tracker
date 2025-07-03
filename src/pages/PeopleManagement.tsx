import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, ArrowLeft, Search, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type Person = Database['public']['Tables']['people']['Row'] & {
  personRoles: Database['public']['Tables']['personRoles']['Row'];
  companies: Database['public']['Tables']['companies']['Row'];
};

const PeopleManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          personRoles (*),
          companies (*)
        `)
        .order('name');

      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Error fetching people:', error);
      toast({
        title: "Error",
        description: "Failed to load people",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePerson = async (personId: string) => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', personId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Person deleted successfully"
      });

      fetchPeople();
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: "Error",
        description: "Failed to delete person",
        variant: "destructive"
      });
    }
  };

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">People Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                People
              </div>
              <Button onClick={() => navigate('/people/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Loading people...</div>
            ) : (
              <div className="space-y-3">
                {filteredPeople.map((person) => (
                  <div key={person.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
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
                          <p className="text-xs text-gray-500">
                            Company: {person.companies?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/people/${person.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this person?')) {
                              deletePerson(person.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

export default PeopleManagement;
