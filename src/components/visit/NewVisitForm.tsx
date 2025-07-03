import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Users } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];
type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'];

interface NewVisitFormProps {}

export const NewVisitForm: React.FC<NewVisitFormProps> = () => {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [sellers, setSellers] = useState<Company[]>([]);
  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string>('');
  
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
      // Reset selling point selection
      setSelectedSellingPointId('');
    }
  }, [selectedSellerId, selectedSupplierId]);

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

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedSeller = sellers.find(s => s.id === selectedSellerId);
  const selectedSellingPoint = sellingPoints.find(p => p.id === selectedSellingPointId);

  const canSubmit = selectedSupplierId && selectedSellerId && selectedSellingPointId;

  const handleSubmit = () => {
    if (canSubmit) {
      console.log('Visit submitted:', {
        supplier: selectedSupplier,
        seller: selectedSeller,
        sellingPoint: selectedSellingPoint
      });
      // TODO: Implement actual visit submission logic
      alert('Visit logged successfully!');
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

            {/* Selection Summary */}
            {canSubmit && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Visit Summary</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Supplier:</span> {selectedSupplier?.name}</p>
                  <p><span className="font-medium">Selling Company:</span> {selectedSeller?.name}</p>
                  <p><span className="font-medium">Selling Point:</span> {selectedSellingPoint?.name}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full"
              size="lg"
            >
              Submit Visit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};