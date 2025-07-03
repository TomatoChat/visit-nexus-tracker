import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Users, Activity, User } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];
type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'];
type VisitActivity = Database['public']['Tables']['visitActivities']['Row'];
type Person = Database['public']['Tables']['people']['Row'];

interface NewVisitFormProps {}

export const NewVisitForm: React.FC<NewVisitFormProps> = () => {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [sellers, setSellers] = useState<Company[]>([]);
  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [activities, setActivities] = useState<VisitActivity[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Load suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Load sellers when supplier is selected
  useEffect(() => {
    if (selectedSupplierId) {
      fetchSellers();
      // Reset subsequent selections
      setSelectedSellerId('');
      setSelectedSellingPointId('');
      setSellers([]);
      setSellingPoints([]);
    }
  }, [selectedSupplierId]);

  // Load selling points when seller is selected
  useEffect(() => {
    if (selectedSellerId && selectedSupplierId) {
      fetchSellingPoints();
      // Reset subsequent selections
      setSelectedSellingPointId('');
      setSelectedActivityId('');
      setSelectedPersonId('');
    }
  }, [selectedSellerId, selectedSupplierId]);

  // Load activities when selling point is selected
  useEffect(() => {
    if (selectedSellingPointId) {
      fetchActivities();
      // Reset subsequent selections
      setSelectedActivityId('');
      setSelectedPersonId('');
    }
  }, [selectedSellingPointId]);

  // Load people when activity is selected
  useEffect(() => {
    if (selectedActivityId && selectedSupplierId && selectedSellerId && selectedSellingPointId) {
      fetchPeople();
      // Reset person selection
      setSelectedPersonId('');
    }
  }, [selectedActivityId, selectedSupplierId, selectedSellerId, selectedSellingPointId]);

  const fetchSuppliers = async () => {
    setLoading(prev => ({ ...prev, suppliers: true }));
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('isSupplier', true);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(prev => ({ ...prev, suppliers: false }));
    }
  };

  const fetchSellers = async () => {
    setLoading(prev => ({ ...prev, sellers: true }));
    try {
      // First, get all selling companies
      const { data: allSellers, error: sellersError } = await supabase
        .from('companies')
        .select('*')
        .eq('isSeller', true);

      if (sellersError) throw sellersError;

      // Then, filter sellers that have selling points connected to the selected supplier
      const { data: relationships, error: relationshipsError } = await supabase
        .from('companySellingPoint')
        .select(`
          sellingPointId,
          sellingPoints!inner(sellerCompanyId)
        `)
        .eq('supplierCompanyId', selectedSupplierId);

      if (relationshipsError) throw relationshipsError;

      // Get unique seller company IDs that have relationships with the supplier
      const connectedSellerIds = [
        ...new Set(
          relationships?.map(rel => rel.sellingPoints?.sellerCompanyId).filter(Boolean) || []
        )
      ];

      // Filter sellers to only include those with connected selling points
      const filteredSellers = allSellers?.filter(seller => 
        connectedSellerIds.includes(seller.id)
      ) || [];

      setSellers(filteredSellers);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(prev => ({ ...prev, sellers: false }));
    }
  };

  const fetchSellingPoints = async () => {
    setLoading(prev => ({ ...prev, sellingPoints: true }));
    try {
      // Get selling points that belong to the selected seller AND have a relationship with the selected supplier
      const { data, error } = await supabase
        .from('sellingPoints')
        .select('*')
        .eq('sellerCompanyId', selectedSellerId)
        .in('id', 
          await supabase
            .from('companySellingPoint')
            .select('sellingPointId')
            .eq('supplierCompanyId', selectedSupplierId)
            .then(({ data }) => data?.map(item => item.sellingPointId) || [])
        );

      if (error) throw error;
      setSellingPoints(data || []);
    } catch (error) {
      console.error('Error fetching selling points:', error);
    } finally {
      setLoading(prev => ({ ...prev, sellingPoints: false }));
    }
  };

  const fetchActivities = async () => {
    setLoading(prev => ({ ...prev, activities: true }));
    try {
      const { data, error } = await supabase
        .from('visitActivities')
        .select('*');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };

  const fetchPeople = async () => {
    setLoading(prev => ({ ...prev, people: true }));
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .or(`companyId.eq.${selectedSupplierId},companyId.eq.${selectedSellerId},sellingPointId.eq.${selectedSellingPointId}`);

      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(prev => ({ ...prev, people: false }));
    }
  };

  const supplierOptions = suppliers.map(supplier => ({
    value: supplier.id,
    label: supplier.name,
    subtitle: supplier.codeVAT
  }));

  const sellerOptions = sellers.map(seller => ({
    value: seller.id,
    label: seller.name,
    subtitle: seller.codeVAT
  }));

  const sellingPointOptions = sellingPoints.map(point => ({
    value: point.id,
    label: point.name,
    subtitle: point.phoneNumber || 'No phone'
  }));

  const activityOptions = activities.map(activity => ({
    value: activity.id,
    label: activity.name,
    subtitle: undefined
  }));

  const personOptions = people.map(person => ({
    value: person.id,
    label: person.name,
    subtitle: person.surname
  }));

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedSeller = sellers.find(s => s.id === selectedSellerId);
  const selectedSellingPoint = sellingPoints.find(p => p.id === selectedSellingPointId);
  const selectedActivity = activities.find(a => a.id === selectedActivityId);
  const selectedPerson = people.find(p => p.id === selectedPersonId);

  const canSubmit = selectedSupplierId && selectedSellerId && selectedSellingPointId && selectedActivityId && selectedPersonId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setLoading(prev => ({ ...prev, submitting: true }));
    try {
      const { data, error } = await supabase
        .from('visits')
        .insert({
          supplierCompanyId: selectedSupplierId,
          sellingPointId: selectedSellingPointId,
          activityId: selectedActivityId,
          agentId: selectedPersonId, // The person making the visit is the agent
          visitDate: new Date().toISOString().split('T')[0], // Today's date
          personVisitedId: null // This could be added later if needed
        })
        .select()
        .single();

      if (error) throw error;
      
      alert('Visit logged successfully!');
      
      // Reset form after successful submission
      setSelectedSupplierId('');
      setSelectedSellerId('');
      setSelectedSellingPointId('');
      setSelectedActivityId('');
      setSelectedPersonId('');
      setSellers([]);
      setSellingPoints([]);
      setActivities([]);
      setPeople([]);
      
    } catch (error) {
      console.error('Error submitting visit:', error);
      alert('Error submitting visit. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6" />
              New Visit Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Select Supplier */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Select Supplier
              </label>
              <SearchableSelect
                options={supplierOptions}
                value={selectedSupplierId}
                onSelect={setSelectedSupplierId}
                placeholder="Choose a supplier company..."
                searchPlaceholder="Search suppliers..."
                disabled={loading.suppliers}
              />
            </div>

            {/* Step 2: Select Selling Company */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Select Selling Company
              </label>
              <SearchableSelect
                options={sellerOptions}
                value={selectedSellerId}
                onSelect={setSelectedSellerId}
                placeholder="Choose a selling company..."
                searchPlaceholder="Search selling companies..."
                disabled={!selectedSupplierId || loading.sellers}
              />
            </div>

            {/* Step 3: Select Selling Point */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Select Selling Point
              </label>
              <SearchableSelect
                options={sellingPointOptions}
                value={selectedSellingPointId}
                onSelect={setSelectedSellingPointId}
                placeholder="Choose a selling point..."
                searchPlaceholder="Search selling points..."
                disabled={!selectedSellerId || loading.sellingPoints}
              />
            </div>

            {/* Step 4: Select Activity */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Select Activity
              </label>
              <SearchableSelect
                options={activityOptions}
                value={selectedActivityId}
                onSelect={setSelectedActivityId}
                placeholder="Choose an activity..."
                searchPlaceholder="Search activities..."
                disabled={!selectedSellingPointId || loading.activities}
              />
            </div>

            {/* Step 5: Select Person */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Select Person
              </label>
              <SearchableSelect
                options={personOptions}
                value={selectedPersonId}
                onSelect={setSelectedPersonId}
                placeholder="Choose a person..."
                searchPlaceholder="Search people..."
                disabled={!selectedActivityId || loading.people}
              />
            </div>

            {/* Selection Summary */}
            {canSubmit && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Visit Summary</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Supplier:</span> {selectedSupplier?.name}</p>
                  <p><span className="font-medium">Selling Company:</span> {selectedSeller?.name}</p>
                  <p><span className="font-medium">Selling Point:</span> {selectedSellingPoint?.name}</p>
                  <p><span className="font-medium">Activity:</span> {selectedActivity?.name}</p>
                  <p><span className="font-medium">Person:</span> {selectedPerson?.name} {selectedPerson?.surname}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || loading.submitting}
              className="w-full"
              size="lg"
            >
              {loading.submitting ? 'Submitting...' : 'Submit Visit'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};