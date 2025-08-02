import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import MyOrdersList from '@/components/data-management/MyOrdersList';
import MyVisitsList from '@/components/data-management/MyVisitsList';
import { Button } from '@/components/ui/button';
import { FileText, ShoppingCart } from 'lucide-react';

const MyData = () => {
  const [activeTab, setActiveTab] = useState('visits');

  return (
    <Layout>
      <div className="min-h-screen w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button and title row */}
        <div className="flex flex-row items-center gap-2 md:hidden mb-4">
          <SidebarTrigger />
          <h1 className="text-lg font-bold text-foreground">I miei dati</h1>
        </div>
        {/* Desktop: Title */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground text-left">I miei dati</h1>
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'visits' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('visits')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Le mie visite
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            I miei ordini
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'visits' && (
          <div className="mt-6">
            <MyVisitsList />
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="mt-6">
            <MyOrdersList />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyData; 