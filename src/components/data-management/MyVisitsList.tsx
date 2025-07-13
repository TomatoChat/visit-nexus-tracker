import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  useUserVisits,
  VisitFilters,
  useSuppliers,
  useSellersBySupplier,
  useSellingPointsBySeller,
  useActivities
} from '@/hooks/use-data';
import { formatDate, formatDateShort, parseDate } from '@/lib/date-utils';
import { usePerformanceTracking } from '@/lib/performance';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this hook exists
import { Label } from '@/components/ui/label';


const MyVisitsList: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { trackRender, trackInteraction } = usePerformanceTracking('MyVisitsList');

  const [filters, setFilters] = useState<VisitFilters>({});
  const [keywordSearchInput, setKeywordSearchInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState<Date | undefined>();
  const [dateToInput, setDateToInput] = useState<Date | undefined>();
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>();
  const [selectedSeller, setSelectedSeller] = useState<string | undefined>();
  const [selectedActivity, setSelectedActivity] = useState<string | undefined>();
  const [selectedSellingPoint, setSelectedSellingPoint] = useState<string | undefined>();

  const debouncedKeywordSearch = useDebounce(keywordSearchInput, 500);

  useEffect(() => {
    const endTimer = trackRender();
    return () => endTimer();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const endTimer = trackInteraction('fetch_user');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      endTimer();
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setFilters(prevFilters => ({ ...prevFilters, keywordSearch: debouncedKeywordSearch || undefined }));
  }, [debouncedKeywordSearch]);

  const { data: visits = [], isLoading, error } = useUserVisits(userId || '', filters);

  // Data for filter dropdowns
  const { data: suppliers } = useSuppliers();
  const { data: sellers } = useSellersBySupplier(selectedSupplier || '');
  const { data: sellingPoints } = useSellingPointsBySeller(selectedSeller || '');
  const { data: activities } = useActivities();

  const handleApplyFilters = () => {
    const endTimer = trackInteraction('apply_filters');
    const newFilters: VisitFilters = {
      keywordSearch: keywordSearchInput || undefined,
      dateFrom: dateFromInput ? formatDate(dateFromInput, 'yyyy-MM-dd') : undefined,
      dateTo: dateToInput ? formatDate(dateToInput, 'yyyy-MM-dd') : undefined,
      supplierId: selectedSupplier || undefined,
      sellerId: selectedSeller || undefined, // Will be handled by selectedSellingPoint if logic is cascaded
      sellingPointId: selectedSellingPoint || undefined,
      activityId: selectedActivity || undefined,
    };
    setFilters(newFilters);
    endTimer();
  };

  const handleClearFilters = () => {
    const endTimer = trackInteraction('clear_filters');
    setKeywordSearchInput('');
    setDateFromInput(undefined);
    setDateToInput(undefined);
    setSelectedSupplier(undefined);
    setSelectedSeller(undefined);
    setSelectedSellingPoint(undefined);
    setSelectedActivity(undefined);
    setFilters({});
    endTimer();
  };

  // Memoize options for select components
  const supplierOptions = useMemo(() => suppliers?.map(s => ({ value: s.id, label: s.name })) || [], [suppliers]);
  const sellerOptions = useMemo(() => sellers?.map(s => ({ value: s.id, label: s.name })) || [], [sellers]);
  const sellingPointOptions = useMemo(() => sellingPoints?.map(sp => ({ value: sp.id, label: sp.name })) || [], [sellingPoints]);
  const activityOptions = useMemo(() => activities?.map(a => ({ value: a.id, label: a.name })) || [], [activities]);

  useEffect(() => {
    // Reset seller if supplier changes
    setSelectedSeller(undefined);
    setSelectedSellingPoint(undefined);
  }, [selectedSupplier]);

  useEffect(() => {
    // Reset selling point if seller changes
    setSelectedSellingPoint(undefined);
  }, [selectedSeller]);


  return (
    <Card className="overflow-x-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
          <div>
            <Label htmlFor="keywordSearch">Keyword Search</Label>
            {/*
              TODO: Enhance keyword search. Currently, the useUserVisits hook does not effectively filter
              by activity name using keywords due to query complexity with related tables.
              The keywordSearch filter is passed but might not be fully utilized by the hook for text search on names.
              The console.warn in useUserVisits provides more details.
              A database function (RPC) would be a more robust solution for text search on related fields.
            */}
            <Input
              id="keywordSearch"
              placeholder="Keyword..."
              value={keywordSearchInput}
              onChange={(e) => setKeywordSearchInput(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dateFrom">Date From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {dateFromInput ? formatDate(dateFromInput, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFromInput} onSelect={setDateFromInput} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="dateTo">Date To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {dateToInput ? formatDate(dateToInput, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateToInput} onSelect={setDateToInput} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
              <SelectContent>
                {supplierOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="seller">Seller</Label>
            <Select value={selectedSeller} onValueChange={setSelectedSeller} disabled={!selectedSupplier || sellerOptions.length === 0}>
              <SelectTrigger><SelectValue placeholder="Select Seller" /></SelectTrigger>
              <SelectContent>
                {sellerOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sellingPoint">Selling Point</Label>
            <Select value={selectedSellingPoint} onValueChange={setSelectedSellingPoint} disabled={!selectedSeller || sellingPointOptions.length === 0}>
              <SelectTrigger><SelectValue placeholder="Select Selling Point" /></SelectTrigger>
              <SelectContent>
                {sellingPointOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="activity">Activity</Label>
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger><SelectValue placeholder="Select Activity" /></SelectTrigger>
              <SelectContent>
                {activityOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-full flex justify-end space-x-2 mt-2">
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        </div>

        {isLoading ? (
          <p>Caricamento visite...</p>
        ) : error ? (
          <div className="text-red-500">Errore nel caricamento delle visite. {error.message}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Attività</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Azienda</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Punto Vendita</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{formatDateShort(visit.visitDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{visit.activity?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{visit.supplierCompany?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{visit.sellingPoint?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visits.length === 0 && !isLoading && !error && <p className="text-center py-4">Nessuna visita trovata per i filtri selezionati.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MyVisitsList; 