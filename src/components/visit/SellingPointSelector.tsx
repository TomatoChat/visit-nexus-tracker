import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'] & {
  addresses: Database['public']['Tables']['addresses']['Row'];
  companies: Database['public']['Tables']['companies']['Row'];
};

type Agent = Database['public']['Tables']['people']['Row'] & {
  personRoles: Database['public']['Tables']['personRoles']['Row'];
};

interface SellingPointSelectorProps {
  supplierCompanyId: string;
  selectedSellingPointId?: string;
  onSelect: (sellingPointId: string, agentId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SellingPointSelector: React.FC<SellingPointSelectorProps> = ({
  supplierCompanyId,
  selectedSellingPointId,
  onSelect,
  onNext,
  onBack
}) => {
  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellingPoints();
    fetchAgents();
  }, [supplierCompanyId]);

  const fetchSellingPoints = async () => {
    setLoading(true);
    try {
      // Fetch selling points that have an active relationship with the supplier company
      const { data, error } = await supabase
        .from('sellingPoints')
        .select(`
          *,
          addresses (*),
          companies (*)
        `)
        .in('id', 
          await supabase
            .from('companySellingPoint')
            .select('sellingPointId')
            .eq('supplierCompanyId', supplierCompanyId)
            .is('endDate', null)
            .then(({ data }) => data?.map(item => item.sellingPointId) || [])
        );

      if (error) throw error;
      setSellingPoints(data || []);
    } catch (error) {
      console.error('Error fetching selling points:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      // Fetch agents from the supplier company
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          personRoles (*)
        `)
        .eq('companyId', supplierCompanyId)
        .eq('personRoles.isAgent', true);

      if (error) throw error;
      setAgents(data || []);
      
      // Auto-select first agent if only one exists
      if (data && data.length === 1) {
        setSelectedAgentId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleSelect = (sellingPointId: string) => {
    if (selectedAgentId) {
      onSelect(sellingPointId, selectedAgentId);
    }
  };

  const canProceed = selectedSellingPointId && selectedAgentId;

  const sortedSellingPoints = sellingPoints.slice().sort((a, b) => a.name.localeCompare(b.name));
  const sortedAgents = agents.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedAgents.map((agent) => (
              <div
                key={agent.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAgentId === agent.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAgentId(agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{agent.name} {agent.surname}</h4>
                    <p className="text-sm text-gray-600">{agent.email}</p>
                  </div>
                  <Badge variant="secondary">Agent</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selling Point Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Select Selling Point
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading selling points...</span>
            </div>
          ) : sortedSellingPoints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No selling points available for this supplier company
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sortedSellingPoints.map((point) => (
                <div
                  key={point.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSellingPointId === point.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelect(point.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{point.name}</h3>
                      <Badge variant="outline">{point.companies?.name}</Badge>
                    </div>
                    {point.phoneNumber && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        {point.phoneNumber}
                      </div>
                    )}
                    {point.addresses && (
                      <p className="text-sm text-gray-600">
                        {point.addresses.addressLine1}, {point.addresses.city}, {point.addresses.stateProvince}
                      </p>
                    )}
                  </div>
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
    </div>
  );
};
