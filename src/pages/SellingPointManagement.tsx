
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Edit, Trash2, ArrowLeft, Search, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'] & {
  addresses: Database['public']['Tables']['addresses']['Row'];
  companies: Database['public']['Tables']['companies']['Row'];
};

const SellingPointManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSellingPoints();
  }, []);

  const fetchSellingPoints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sellingPoints')
        .select(`
          *,
          addresses (*),
          companies (*)
        `)
        .order('name');

      if (error) throw error;
      setSellingPoints(data || []);
    } catch (error) {
      console.error('Error fetching selling points:', error);
      toast({
        title: "Error",
        description: "Failed to load selling points",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSellingPoint = async (sellingPointId: string) => {
    try {
      const { error } = await supabase
        .from('sellingPoints')
        .delete()
        .eq('id', sellingPointId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Selling point deleted successfully"
      });

      fetchSellingPoints();
    } catch (error) {
      console.error('Error deleting selling point:', error);
      toast({
        title: "Error",
        description: "Failed to delete selling point",
        variant: "destructive"
      });
    }
  };

  const filteredSellingPoints = sellingPoints.filter(point =>
    point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.companies?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.addresses?.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/visit-tracker')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Visit Tracker
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Selling Point Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Selling Points
              </div>
              <Button onClick={() => navigate('/selling-points/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Selling Point
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search selling points..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Loading selling points...</div>
            ) : (
              <div className="space-y-3">
                {filteredSellingPoints.map((point) => (
                  <div key={point.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-medium">{point.name}</h3>
                        <p className="text-sm text-gray-600">
                          Company: {point.companies?.name}
                        </p>
                        {point.phoneNumber && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {point.phoneNumber}
                          </div>
                        )}
                        {point.addresses && (
                          <p className="text-xs text-gray-500">
                            {point.addresses.addressLine1}, {point.addresses.city}, {point.addresses.stateProvince}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/selling-points/${point.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this selling point?')) {
                              deleteSellingPoint(point.id);
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

export default SellingPointManagement;
