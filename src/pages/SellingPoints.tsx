import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import SellingPointManagement from '@/components/data-management/SellingPointManagement';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter } from 'lucide-react';
import { useSellers } from '@/hooks/use-data';
import { SearchableSelect } from '@/components/ui/searchable-select';

const SellingPoints = () => {
  const { userRole, loading } = useRoles();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [triggerAddForm, setTriggerAddForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSellerFilters, setSelectedSellerFilters] = useState<string[]>([]);
  
  // Fetch seller companies for filter
  const { data: sellers = [], isLoading: isLoadingSellers } = useSellers();

  // Show loading state while determining user role
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // If user has no role or is guest, show access denied
  if (!userRole || userRole === 'guest') {
    return (
      <Layout>
        <div className="min-h-screen w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-red-600">Access Denied</div>
          </div>
        </div>
      </Layout>
    );
  }

  // External agents cannot access this page
  if (userRole === 'externalAgent') {
    return (
      <Layout>
        <div className="min-h-screen w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-red-600">Access Denied</div>
          </div>
        </div>
      </Layout>
    );
  }

  // Prepare filter options
  const filterOptions = sellers.map(seller => ({
    value: seller.id,
    label: seller.name
  }));

  return (
    <Layout>
      <div className="min-h-screen w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button, title, and actions */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-gray-800">Punti Vendita</h1>
          </div>
          <div className="flex items-center gap-2">
            {!showSearch && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerca"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
            {showSearch && (
              <Input
                ref={searchInputRef}
                autoFocus
                className="w-32"
                placeholder="Cerca..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Filtra per azienda venditrice"
              onClick={() => setShowFilter(!showFilter)}
              className={showFilter ? "bg-blue-50 text-blue-600" : ""}
            >
              <Filter className="w-5 h-5" />
            </Button>
            {!userRole?.includes('internalAgent') && (
              <Button 
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50" 
                onClick={() => setTriggerAddForm(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        {/* Desktop: Title and actions */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-left">Punti Vendita</h1>
          <div className="flex items-center gap-2">
            {!showSearch && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerca"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
            {showSearch && (
              <Input
                ref={searchInputRef}
                autoFocus
                className="w-48"
                placeholder="Cerca punti vendita..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setShowSearch(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSearch(false);
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Filtra per azienda venditrice"
              onClick={() => setShowFilter(!showFilter)}
              className={showFilter ? "bg-blue-50 text-blue-600" : ""}
            >
              <Filter className="w-5 h-5" />
            </Button>
            {!userRole?.includes('internalAgent') && (
              <Button 
                variant="ghost"
                size="icon"
                className="border-black text-black hover:bg-gray-50" 
                onClick={() => setTriggerAddForm(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {showFilter && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filtra per azienda venditrice</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSellerFilters([])}
                className="text-xs"
              >
                Deseleziona tutto
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filterOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSellerFilters.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSellerFilters(prev => [...prev, option.value]);
                      } else {
                        setSelectedSellerFilters(prev => prev.filter(id => id !== option.value));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {selectedSellerFilters.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-xs text-gray-500">
                  {selectedSellerFilters.length} azienda{selectedSellerFilters.length !== 1 ? 'e' : ''} selezionata{selectedSellerFilters.length !== 1 ? 'e' : ''}
                </span>
              </div>
            )}
          </div>
        )}
        
        <SellingPointManagement 
          readOnly={userRole === 'internalAgent'} 
          searchTerm={searchTerm} 
          sellerFilters={selectedSellerFilters}
          triggerAddForm={triggerAddForm}
          onAddFormShown={() => setTriggerAddForm(false)}
        />
      </div>
    </Layout>
  );
};

export default SellingPoints; 