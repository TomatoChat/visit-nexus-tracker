import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Filter, X, Search } from 'lucide-react';
import { useSuppliers, useSellers, useSellingPoints } from '@/hooks/use-data';

export interface DataFilters {
  supplierId?: string;
  sellerId?: string;
  sellingPointId?: string;
}

interface DataFilterProps {
  filters: DataFilters;
  onFiltersChange: (filters: DataFilters) => void;
  onClearFilters: () => void;
}

const DataFilter: React.FC<DataFilterProps> = ({ filters, onFiltersChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>(filters.supplierId);
  const [selectedSeller, setSelectedSeller] = useState<string | undefined>(filters.sellerId);
  const [selectedSellingPoint, setSelectedSellingPoint] = useState<string | undefined>(filters.sellingPointId);

  // Search states
  const [supplierSearch, setSupplierSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellingPointSearch, setSellingPointSearch] = useState('');

  // Data for filter dropdowns - all independent
  const { data: suppliers } = useSuppliers();
  const { data: sellers } = useSellers();
  const { data: sellingPoints } = useSellingPoints();

  // Memoize options for select components with search filtering
  const supplierOptions = useMemo(() => {
    if (!suppliers) return [];
    const filtered = suppliers.filter(s => 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );
    return filtered.map(s => ({ value: s.id, label: s.name }));
  }, [suppliers, supplierSearch]);

  const sellerOptions = useMemo(() => {
    if (!sellers) return [];
    const filtered = sellers.filter(s => 
      s.name.toLowerCase().includes(sellerSearch.toLowerCase())
    );
    return filtered.map(s => ({ value: s.id, label: s.name }));
  }, [sellers, sellerSearch]);

  const sellingPointOptions = useMemo(() => {
    if (!sellingPoints) return [];
    const filtered = sellingPoints.filter(sp => 
      sp.name.toLowerCase().includes(sellingPointSearch.toLowerCase())
    );
    return filtered.map(sp => ({ value: sp.id, label: sp.name }));
  }, [sellingPoints, sellingPointSearch]);

  const handleApplyFilters = () => {
    const newFilters: DataFilters = {
      supplierId: selectedSupplier || undefined,
      sellerId: selectedSeller || undefined,
      sellingPointId: selectedSellingPoint || undefined,
    };
    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedSupplier(undefined);
    setSelectedSeller(undefined);
    setSelectedSellingPoint(undefined);
    // Clear search inputs
    setSupplierSearch('');
    setSellerSearch('');
    setSellingPointSearch('');
    onClearFilters();
    setIsOpen(false);
  };

  // Individual clear handlers that update both local state and parent filters
  const handleClearSupplier = () => {
    setSelectedSupplier(undefined);
    const newFilters = {
      ...filters,
      supplierId: undefined
    };
    onFiltersChange(newFilters);
  };

  const handleClearSeller = () => {
    setSelectedSeller(undefined);
    const newFilters = {
      ...filters,
      sellerId: undefined
    };
    onFiltersChange(newFilters);
  };

  const handleClearSellingPoint = () => {
    setSelectedSellingPoint(undefined);
    const newFilters = {
      ...filters,
      sellingPointId: undefined
    };
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = filters.supplierId || filters.sellerId || filters.sellingPointId;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] max-w-sm p-4 md:w-80" 
        align="end" 
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        avoidCollisions={true}
        collisionPadding={16}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {hasActiveFilters && (
            <div className="flex justify-end sticky top-0 bg-background pt-2 pb-2">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="supplier" className="text-sm font-medium">Azienda fornitrice</label>
              <div className="relative mt-1">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className={`h-10 ${selectedSupplier ? "pr-10" : ""}`}>
                    <SelectValue placeholder="Seleziona fornitore" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] w-[calc(100vw-4rem)] md:w-auto">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca fornitore..."
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                    </div>
                    {supplierOptions.length > 0 ? (
                      supplierOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nessun fornitore trovato
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedSupplier && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={handleClearSupplier}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="seller" className="text-sm font-medium">Azienda venditore</label>
              <div className="relative mt-1">
                <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                  <SelectTrigger className={`h-10 ${selectedSeller ? "pr-10" : ""}`}>
                    <SelectValue placeholder="Seleziona venditore" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] w-[calc(100vw-4rem)] md:w-auto">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca venditore..."
                          value={sellerSearch}
                          onChange={(e) => setSellerSearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                    </div>
                    {sellerOptions.length > 0 ? (
                      sellerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nessun venditore trovato
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedSeller && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={handleClearSeller}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="sellingPoint" className="text-sm font-medium">Punto vendita</label>
              <div className="relative mt-1">
                <Select value={selectedSellingPoint} onValueChange={setSelectedSellingPoint}>
                  <SelectTrigger className={`h-10 ${selectedSellingPoint ? "pr-10" : ""}`}>
                    <SelectValue placeholder="Seleziona punto vendita" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] w-[calc(100vw-4rem)] md:w-auto">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca punto vendita..."
                          value={sellingPointSearch}
                          onChange={(e) => setSellingPointSearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                    </div>
                    {sellingPointOptions.length > 0 ? (
                      sellingPointOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nessun punto vendita trovato
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedSellingPoint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={handleClearSellingPoint}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-background">
            <Button onClick={handleApplyFilters} className="flex-1 h-10">
              Applica
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 h-10">
              Annulla
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DataFilter; 