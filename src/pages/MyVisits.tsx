import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import MyVisitsList from '@/components/data-management/MyVisitsList';

const MyVisits = () => {
  return (
    <Layout>
      <div className="min-h-screen w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button and title row */}
        <div className="flex flex-row items-center gap-2 md:hidden mb-4">
          <SidebarTrigger />
          <h1 className="text-lg font-bold text-foreground">Le mie visite</h1>
        </div>
        {/* Desktop: Title */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground text-left">Le mie visite</h1>
        </div>
        <MyVisitsList />
      </div>
    </Layout>
  );
};

export default MyVisits; 