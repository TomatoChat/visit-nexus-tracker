import { NewVisitForm } from "@/components/visit/NewVisitForm";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Activity, ShoppingCart } from 'lucide-react';

const NewVisitOrder = () => {
  const [activeTab, setActiveTab] = useState<'visit' | 'order'>('visit');

  return (
    <Layout>
      {/* Mobile: Sidebar button and title row */}
      <div className="flex flex-row items-center gap-2 md:hidden mb-4">
        <SidebarTrigger />
        <h1 className="text-lg font-bold text-foreground">Nuovi dati</h1>
      </div>
      {/* Desktop: Title */}
      <div className="hidden md:flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground text-left">Nuovi dati</h1>
      </div>
      
      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'visit' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('visit')}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Visita
        </Button>
        <Button
          variant={activeTab === 'order' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('order')}
          className="flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Ordine
        </Button>
      </div>

      {/* Content */}
      <NewVisitForm activeTab={activeTab} />
    </Layout>
  );
};

export default NewVisitOrder;
