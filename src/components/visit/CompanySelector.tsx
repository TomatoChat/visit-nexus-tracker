
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'] & {
  addresses: Database['public']['Tables']['addresses']['Row'];
};

interface CompanySelectorProps {
  type: 'supplier' | 'seller';
  selectedCompanyId?: string;
  onSelect: (companyId: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  type,
  selectedCompanyId,
  onSelect,
  onNext,
  onBack
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, [type]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          addresses (*)
        `)
        .eq(type === 'supplier' ? 'isSupplier' : 'isSeller', true);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (companyId: string) => {
    onSelect(companyId);
  };

  const canProceed = selectedCompanyId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Select {type === 'supplier' ? 'Supplier' : 'Seller'} Company
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading companies...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCompanyId === company.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelect(company.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{company.name}</h3>
                    <p className="text-sm text-gray-600">{company.codeVAT}</p>
                    {company.addresses && (
                      <p className="text-xs text-gray-500">
                        {company.addresses.city}, {company.addresses.stateProvince}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {company.isSupplier && (
                      <Badge variant="secondary" className="text-xs">Supplier</Badge>
                    )}
                    {company.isSeller && (
                      <Badge variant="outline" className="text-xs">Seller</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
          )}
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
