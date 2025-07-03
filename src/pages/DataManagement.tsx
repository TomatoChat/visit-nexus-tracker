import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Building, Store, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type EntityType = 'person' | 'seller' | 'supplier' | 'sellingPoint';

const DataManagement = () => {
  const navigate = useNavigate();
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('person');

  const renderForm = () => {
    switch (selectedEntityType) {
      case 'person':
        return <AddNewPersonForm />;
      case 'seller':
        return <p>Add New Seller form (Not implemented yet)</p>;
      case 'supplier':
        return <p>Add New Supplier form (Not implemented yet)</p>;
      case 'sellingPoint':
        return <p>Add New Selling Point form (Not implemented yet)</p>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Data Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-gray-700">Select Entity Type to Add</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-2">
            <Button
              variant={selectedEntityType === 'person' ? 'default' : 'outline'}
              onClick={() => setSelectedEntityType('person')}
              className="flex-1"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Person
            </Button>
            <Button
              variant={selectedEntityType === 'seller' ? 'default' : 'outline'}
              onClick={() => setSelectedEntityType('seller')}
              disabled // Not implemented yet
              className="flex-1"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add New Seller
            </Button>
            <Button
              variant={selectedEntityType === 'supplier' ? 'default' : 'outline'}
              onClick={() => setSelectedEntityType('supplier')}
              disabled // Not implemented yet
              className="flex-1"
            >
              <Building className="w-4 h-4 mr-2" />
              Add New Supplier
            </Button>
            <Button
              variant={selectedEntityType === 'sellingPoint' ? 'default' : 'outline'}
              onClick={() => setSelectedEntityType('sellingPoint')}
              disabled // Not implemented yet
              className="flex-1"
            >
              <Store className="w-4 h-4 mr-2" />
              Add New Selling Point
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

import { useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Company = Database['public']['Tables']['companies']['Row'];
type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'];
type PersonRole = Database['public']['Tables']['personRoles']['Row'];

interface Option {
  value: string;
  label: string;
}

// AddNewPersonForm component
const AddNewPersonForm = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);

  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string | undefined>(undefined);
  const [isSellingPointDropdownEnabled, setIsSellingPointDropdownEnabled] = useState(false);

  const [personRoles, setPersonRoles] = useState<PersonRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);

  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingSellingPoints, setIsLoadingSellingPoints] = useState(false);
  const [isLoadingPersonRoles, setIsLoadingPersonRoles] = useState(false);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching companies:', error);
        toast({ title: 'Error fetching companies', variant: 'destructive' });
      } else {
        setCompanies(data || []);
      }
      setIsLoadingCompanies(false);
    };
    fetchCompanies();
  }, [toast]);

  // Fetch person roles
  useEffect(() => {
    const fetchPersonRoles = async () => {
      setIsLoadingPersonRoles(true);
      const { data, error } = await supabase
        .from('personRoles')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching person roles:', error);
        toast({ title: 'Error fetching person roles', variant: 'destructive' });
      } else {
        setPersonRoles(data || []);
      }
      setIsLoadingPersonRoles(false);
    };
    fetchPersonRoles();
  }, [toast]);

  // Handle company selection logic
  useEffect(() => {
    const company = companies.find(c => c.id === selectedCompanyId);
    setSelectedCompany(company);
    setSelectedSellingPointId(undefined); // Reset selling point when company changes

    if (company && company.isSeller) {
      setIsSellingPointDropdownEnabled(true);
    } else {
      setIsSellingPointDropdownEnabled(false);
    }
  }, [selectedCompanyId, companies]);

  // Fetch selling points when selected company is a seller
  useEffect(() => {
    if (selectedCompany && selectedCompany.isSeller && selectedCompanyId) {
      const fetchSellingPoints = async () => {
        setIsLoadingSellingPoints(true);
        const { data, error } = await supabase
          .from('sellingPoints')
          .select('*')
          .eq('sellerCompanyId', selectedCompanyId)
          .order('name', { ascending: true });
        if (error) {
          console.error('Error fetching selling points:', error);
          toast({ title: 'Error fetching selling points', variant: 'destructive' });
        } else {
          setSellingPoints(data || []);
        }
        setIsLoadingSellingPoints(false);
      };
      fetchSellingPoints();
    } else {
      setSellingPoints([]); // Clear selling points if company is not a seller or no company selected
    }
  }, [selectedCompany, selectedCompanyId, toast]);


  const companyOptions = useMemo(() => companies.map(c => ({ value: c.id, label: c.name })), [companies]);
  const sellingPointOptions = useMemo(() => sellingPoints.map(sp => ({ value: sp.id, label: sp.name })), [sellingPoints]);
  const personRoleOptions = useMemo(() => personRoles.map(pr => ({ value: pr.id, label: pr.name })), [personRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory fields
    if (!name || !surname || !email || !phoneNumber || !selectedCompanyId || !selectedRoleId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all mandatory fields (*).',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newPersonData: Database['public']['Tables']['people']['Insert'] = {
        name,
        surname,
        email,
        phoneNumber,
        companyId: selectedCompanyId,
        roleId: selectedRoleId,
        sellingPointId: selectedSellingPointId || null, // Can be null
      };

      const { error } = await supabase.from('people').insert(newPersonData);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success!',
        description: 'Person added successfully!',
      });

      // Clear form fields
      setName('');
      setSurname('');
      setEmail('');
      setPhoneNumber('');
      setSelectedCompanyId(undefined);
      setSelectedSellingPointId(undefined);
      setSelectedRoleId(undefined);
      // The selectedCompany and selling point dropdown state will reset due to useEffect dependencies

    } catch (error: any) {
      console.error('Error inserting person:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add person. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-700">Add New Person</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="surname">Surname <span className="text-red-500">*</span></Label>
              <Input id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
              <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label htmlFor="company">Select Company <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={companyOptions}
              value={selectedCompanyId}
              onSelect={setSelectedCompanyId}
              placeholder={isLoadingCompanies ? "Loading companies..." : "Select a company"}
              searchPlaceholder="Search companies..."
              disabled={isLoadingCompanies}
            />
          </div>

          <div>
            <Label htmlFor="sellingPoint">Select Selling Point</Label>
            <SearchableSelect
              options={sellingPointOptions}
              value={selectedSellingPointId}
              onSelect={setSelectedSellingPointId}
              placeholder={isLoadingSellingPoints ? "Loading selling points..." : (isSellingPointDropdownEnabled ? "Select a selling point" : "N/A - Select a seller company first")}
              searchPlaceholder="Search selling points..."
              disabled={!isSellingPointDropdownEnabled || isLoadingSellingPoints}
            />
          </div>

          <div>
            <Label htmlFor="role">Select Role <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={personRoleOptions}
              value={selectedRoleId}
              onSelect={setSelectedRoleId}
              placeholder={isLoadingPersonRoles ? "Loading roles..." : "Select a role"}
              searchPlaceholder="Search roles..."
              disabled={isLoadingPersonRoles}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              Save Person
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DataManagement;
