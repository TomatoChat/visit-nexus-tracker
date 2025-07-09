import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DataManagement from "./pages/DataManagement";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Car, DatabaseZap, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function SidebarMenuContent() {
  const location = useLocation();
  const { state, isMobile } = useSidebar();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Show label on mobile or when sidebar is expanded
  const showLabel = isMobile || state === "expanded";

  return (
    <SidebarContent className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/">
              <SidebarMenuButton isActive={location.pathname === "/"}>
                <Car className="w-5 h-5 flex-shrink-0" />
                {showLabel && (
                  <span className="truncate">Nuovo Rapporto Visita</span>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link to="/data-management">
              <SidebarMenuButton isActive={location.pathname === "/data-management"}>
                <DatabaseZap className="w-5 h-5 flex-shrink-0" />
                {showLabel && (
                  <span className="truncate">Data Management</span>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
      <div className="border-t px-4 py-4 shrink-0">
        {session?.user && (
          <>
            {(showLabel) && (
              <div className="text-sm text-muted-foreground mb-2">
                {session.user.email}
              </div>
            )}
            <SidebarMenu>
              <SidebarMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <SidebarMenuButton>
                      <LogOut className="w-5 h-5 flex-shrink-0" />
                      {showLabel && (
                        <span className="truncate">Logout</span>
                      )}
                    </SidebarMenuButton>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Conferma Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sei sicuro di voler uscire? Dovrai effettuare nuovamente l'accesso per utilizzare l'applicazione.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>
                        Esci
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
      </div>
    </SidebarContent>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined);
  const location = useLocation();
  
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      return () => {
        listener?.subscription.unsubscribe();
      };
    });
  }, []);

  // Show loading state while checking session
  if (session === undefined) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not logged in and not on the login page, redirect to login
  if (!session && location.pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  // If logged in and on the login page, redirect to home (but stay on same page)
  if (session && location.pathname === "/") {
    // Don't redirect, just show the content
  }

  // Only show sidebar if logged in
  return session ? (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-end p-2">
              <SidebarTrigger />
            </div>
            <SidebarMenuContent />
          </div>
        </Sidebar>
        <main className="flex-1 w-full min-h-screen bg-gray-100 p-0 md:p-8 relative md:pt-0">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  ) : (
    <main className="flex-1 w-full min-h-screen bg-gray-100 p-0 md:p-8 relative">
      <div className="w-full h-full">{children}</div>
    </main>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/data-management" element={<DataManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
