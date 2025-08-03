import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Filter, X, Search } from 'lucide-react';
import { useSuppliers, useSellingPoints, useAllUsers } from '@/hooks/use-data';

export interface OrderFilters {
  supplierId?: string;
  sellingPointId?: string;
  userId?: string;
}

interface OrderFilterProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
}

const OrderFilter: React.FC<OrderFilterProps> = ({ filters, onFiltersChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>(filters.supplierId);
  const [selectedSellingPoint, setSelectedSellingPoint] = useState<string | undefined>(filters.sellingPointId);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(filters.userId);

  // Search states
  const [supplierSearch, setSupplierSearch] = useState('');
  const [sellingPointSearch, setSellingPointSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Data for filter dropdowns
  const { data: suppliers = [] } = useSuppliers();
  const { data: sellingPoints = [] } = useSellingPoints();
  const { data: users = [] } = useAllUsers();

  // Memoize options for select components with search filtering
  const supplierOptions = useMemo(() => {
    if (!suppliers) return [];
    const filtered = suppliers.filter(s => 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );
    return filtered.map(s => ({ value: s.id, label: s.name }));
  }, [suppliers, supplierSearch]);

  const sellingPointOptions = useMemo(() => {
    if (!sellingPoints) return [];
    const filtered = sellingPoints.filter(sp => 
      sp.name.toLowerCase().includes(sellingPointSearch.toLowerCase())
    );
    return filtered.map(sp => ({ value: sp.id, label: sp.name }));
  }, [sellingPoints, sellingPointSearch]);

  const userOptions = useMemo(() => {
    if (!users) return [];
    const filtered = users.filter(u => 
      (u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
       u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    );
    return filtered.map(u => ({ value: u.id, label: u.displayName || u.email || 'Unknown' }));
  }, [users, userSearch]);

  const handleApplyFilters = () => {
    const newFilters: OrderFilters = {
      supplierId: selectedSupplier || undefined,
      sellingPointId: selectedSellingPoint || undefined,
      userId: selectedUser || undefined,
    };
    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedSupplier(undefined);
    setSelectedSellingPoint(undefined);
    setSelectedUser(undefined);
    // Clear search inputs
    setSupplierSearch('');
    setSellingPointSearch('');
    setUserSearch('');
    onClearFilters();
    setIsOpen(false);
  };

  // Individual clear handlers
  const handleClearSupplier = () => {
    setSelectedSupplier(undefined);
    const newFilters = {
      ...filters,
      supplierId: undefined
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

  const handleClearUser = () => {
    setSelectedUser(undefined);
    const newFilters = {
      ...filters,
      userId: undefined
    };
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = filters.supplierId || filters.sellingPointId || filters.userId;

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
          <div className="space-y-4">
            <div>
              <label htmlFor="supplier" className="text-sm font-medium">Fornitore</label>
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

            <div>
              <label htmlFor="user" className="text-sm font-medium">Utente</label>
              <div className="relative mt-1">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className={`h-10 ${selectedUser ? "pr-10" : ""}`}>
                    <SelectValue placeholder="Seleziona utente" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] w-[calc(100vw-4rem)] md:w-auto">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca utente..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                    </div>
                    {userOptions.length > 0 ? (
                      userOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nessun utente trovato
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={handleClearUser}
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

export default OrderFilter; 