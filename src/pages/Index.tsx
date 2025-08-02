import { NewVisitForm } from "@/components/visit/NewVisitForm";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Layout from '@/components/Layout';

const Index = () => {
  return (
    <Layout>
      {/* Mobile: Sidebar button and title row */}
      <div className="flex flex-row items-center gap-2 md:hidden mb-4">
        <SidebarTrigger />
        <h1 className="text-lg font-bold text-foreground">Nuova Visita/Ordine</h1>
      </div>
      {/* Desktop: Title */}
      <div className="hidden md:flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground text-left">Nuova Visita/Ordine</h1>
      </div>
      <NewVisitForm />
    </Layout>
  );
};

export default Index;
