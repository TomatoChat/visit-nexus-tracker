import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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

  const companyOptions = companies
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(company => ({
      value: company.id,
      label: company.name,
      subtitle: `${company.codeVAT} • ${company.addresses?.city}, ${company.addresses?.stateProvince}`
    }));

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
          <div className="space-y-4">
            <SearchableSelect
              options={companyOptions}
              value={selectedCompanyId}
              onSelect={onSelect}
              placeholder={`Select ${type} company...`}
              searchPlaceholder="Search companies..."
            />
            
            <Button
              variant="outline"
              onClick={() => navigate('/companies')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Companies
            </Button>
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
