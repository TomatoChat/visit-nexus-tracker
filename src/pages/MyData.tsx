import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import MyOrdersList from '@/components/data-management/MyOrdersList';
import MyVisitsList from '@/components/data-management/MyVisitsList';
import { Button } from '@/components/ui/button';
import { FileText, ShoppingCart, Activity } from 'lucide-react';
import DataFilter, { DataFilters } from '@/components/ui/data-filter';

const MyData = () => {
  const [activeTab, setActiveTab] = useState('visits');
  const [filters, setFilters] = useState<DataFilters>({});

  const handleFiltersChange = (newFilters: DataFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <Layout>
      <div className="min-h-screen w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button and title row */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-foreground">I miei dati</h1>
          </div>
          <DataFilter 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
        
        {/* Desktop: Title and filter */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground text-left">I miei dati</h1>
          <DataFilter 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'visits' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('visits')}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Visite
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Ordini
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'visits' && (
          <div className="mt-6">
            <MyVisitsList filters={filters} />
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="mt-6">
            <MyOrdersList filters={filters} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyData; 