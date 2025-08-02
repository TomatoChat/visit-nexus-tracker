import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import OrderManagement from '@/components/data-management/OrderManagement';

const OrderManagementPage = () => {
  return (
    <Layout>
      {/* Mobile: Sidebar button and title row */}
      <div className="flex flex-row items-center gap-2 md:hidden mb-4">
        <SidebarTrigger />
      </div>
      
      <OrderManagement />
    </Layout>
  );
};

export default OrderManagementPage; 