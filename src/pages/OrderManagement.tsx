import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import OrderManagement from '@/components/data-management/OrderManagement';
import OrderFilter, { OrderFilters } from '@/components/ui/order-filter';

const OrderManagementPage = () => {
  const [filters, setFilters] = useState<OrderFilters>({});

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <Layout>
      <div className="w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button and actions */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          <OrderFilter 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
        
        {/* Desktop: Title and actions */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-left">Gestione Ordini</h1>
          <OrderFilter 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
        
        <OrderManagement filters={filters} />
      </div>
    </Layout>
  );
};

export default OrderManagementPage; 