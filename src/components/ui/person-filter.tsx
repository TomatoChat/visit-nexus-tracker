import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Filter, X, Search } from 'lucide-react';
import { useSuppliers, useSellingPoints, usePersonRoles } from '@/hooks/use-data';

export interface PersonFilters {
  companyId?: string;
  sellingPointId?: string;
  roleId?: string;
}

interface PersonFilterProps {
  filters: PersonFilters;
  onFiltersChange: (filters: PersonFilters) => void;
  onClearFilters: () => void;
}

const PersonFilter: React.FC<PersonFilterProps> = ({ filters, onFiltersChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>(filters.companyId);
  const [selectedSellingPoint, setSelectedSellingPoint] = useState<string | undefined>(filters.sellingPointId);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(filters.roleId);

  // Search states
  const [companySearch, setCompanySearch] = useState('');
  const [sellingPointSearch, setSellingPointSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // Data for filter dropdowns
  const { data: companies = [] } = useSuppliers();
  const { data: sellingPoints = [] } = useSellingPoints();
  const { data: roles = [] } = usePersonRoles();

  // Memoize options for select components with search filtering
  const companyOptions = useMemo(() => {
    if (!companies) return [];
    const filtered = companies.filter(c => 
      c.name.toLowerCase().includes(companySearch.toLowerCase())
    );
    return filtered.map(c => ({ value: c.id, label: c.name }));
  }, [companies, companySearch]);

  const sellingPointOptions = useMemo(() => {
    if (!sellingPoints) return [];
    const filtered = sellingPoints.filter(sp => 
      sp.name.toLowerCase().includes(sellingPointSearch.toLowerCase())
    );
    return filtered.map(sp => ({ value: sp.id, label: sp.name }));
  }, [sellingPoints, sellingPointSearch]);

  const roleOptions = useMemo(() => {
    if (!roles) return [];
    const filtered = roles.filter(r => 
      r.name.toLowerCase().includes(roleSearch.toLowerCase())
    );
    return filtered.map(r => ({ value: r.id, label: r.name }));
  }, [roles, roleSearch]);

  const handleApplyFilters = () => {
    const newFilters: PersonFilters = {
      companyId: selectedCompany || undefined,
      sellingPointId: selectedSellingPoint || undefined,
      roleId: selectedRole || undefined,
    };
    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCompany(undefined);
    setSelectedSellingPoint(undefined);
    setSelectedRole(undefined);
    // Clear search inputs
    setCompanySearch('');
    setSellingPointSearch('');
    setRoleSearch('');
    onClearFilters();
    setIsOpen(false);
  };

  // Individual clear handlers
  const handleClearCompany = () => {
    setSelectedCompany(undefined);
    const newFilters = {
      ...filters,
      companyId: undefined
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

  const handleClearRole = () => {
    setSelectedRole(undefined);
    const newFilters = {
      ...filters,
      roleId: undefined
    };
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = filters.companyId || filters.sellingPointId || filters.roleId;

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
              <label htmlFor="company" className="text-sm font-medium">Azienda</label>
              <div className="relative mt-1">
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className={`h-10 ${selectedCompany ? "pr-10" : ""}`}>
                    <SelectValue placeholder="Seleziona azienda" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] w-[calc(100vw-4rem)] md:w-auto">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca azienda..."
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                    </div>
                    {companyOptions.length > 0 ? (
                      companyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nessuna azienda trovata
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedCompany && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={handleClearCompany}
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
              <label htmlFor="role" className="text-sm font-medium">Ruolo</label>
              <div className="relative mt-1">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className={`h-10 ${selectedRole ? "pr-10" : ""}`}>
                    <SelectValue placeholder="Seleziona ruolo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] w-[calc(100vw-4rem)] md:w-auto">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca ruolo..."
                          value={roleSearch}
                          onChange={(e) => setRoleSearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                    </div>
                    {roleOptions.length > 0 ? (
                      roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nessun ruolo trovato
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={handleClearRole}
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

export default PersonFilter; 