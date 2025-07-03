import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type Company = Database['public']['Tables']['companies']['Row'] & {
  addresses: Database['public']['Tables']['addresses']['Row'];
};

const CompanyManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          addresses (*)
        `)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company deleted successfully"
      });

      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      });
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.codeVAT.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Companies
              </div>
              <Button onClick={() => navigate('/companies/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Loading companies...</div>
            ) : (
              <div className="space-y-3">
                {filteredCompanies.map((company) => (
                  <div key={company.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{company.name}</h3>
                        <p className="text-sm text-gray-600">VAT: {company.codeVAT}</p>
                        {company.addresses && (
                          <p className="text-xs text-gray-500">
                            {company.addresses.city}, {company.addresses.stateProvince}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {company.isSupplier && (
                          <Badge variant="secondary">Supplier</Badge>
                        )}
                        {company.isSeller && (
                          <Badge variant="outline">Seller</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/companies/${company.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this company?')) {
                              deleteCompany(company.id);
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

export default CompanyManagement;
