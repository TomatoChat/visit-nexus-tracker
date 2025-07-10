import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

import MyVisits from "@/pages/MyVisits";
import Companies from "@/pages/Companies";
import SellingPoints from "@/pages/SellingPoints";
import People from "@/pages/People";
import Activities from "@/pages/Activities";
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
import { Car, DatabaseZap, LogOut, Power, Lock, Building, MapPin, Users, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from '@/components/Layout';
import { RoleDisplay } from '@/components/ui/role-display';
import { useRoles } from '@/hooks/use-roles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function SidebarMenuContent() {
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const { userRole, userWithRole } = useRoles();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUserId(user?.id || null);
    });
  }, []);

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

  const handleLogoutClick = () => setShowLogoutDialog(true);

  const confirmLogout = async () => {
    await supabase.auth.signOut();
  };

  // Close mobile sidebar when navigation link is clicked
  const handleNavigationClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarContent className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          {/* <RoleDisplay /> removed as per user request */}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/" onClick={handleNavigationClick}>
              <SidebarMenuButton isActive={location.pathname === "/"}>
                <Car className="w-5 h-5 flex-shrink-0" />
                {(state === 'expanded' || isMobile) && <span className="truncate">Nuovo Rapporto Visita</span>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          
          {/* My Visits - visible to all authenticated users */}
          <SidebarMenuItem>
            <Link to="/my-visits" onClick={handleNavigationClick}>
              <SidebarMenuButton isActive={location.pathname === "/my-visits"}>
                <FileText className="w-5 h-5 flex-shrink-0" />
                {(state === 'expanded' || isMobile) && <span className="truncate">Le mie visite</span>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {/* Data Management Pages - only visible to internal agents and admins */}
          {userRole && userRole !== 'externalAgent' && userRole !== 'guest' && (
            <>
              <SidebarMenuItem>
                <Link to="/companies" onClick={handleNavigationClick}>
                  <SidebarMenuButton isActive={location.pathname === "/companies"}>
                    <Building className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Aziende</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <Link to="/selling-points" onClick={handleNavigationClick}>
                  <SidebarMenuButton isActive={location.pathname === "/selling-points"}>
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Punti Vendita</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <Link to="/people" onClick={handleNavigationClick}>
                  <SidebarMenuButton isActive={location.pathname === "/people"}>
                    <Users className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Persone</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <Link to="/activities" onClick={handleNavigationClick}>
                  <SidebarMenuButton isActive={location.pathname === "/activities"}>
                    <Activity className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Attività</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </div>
      <button
        onClick={handleLogoutClick}
        className="w-full flex items-center gap-2 px-4 py-3 text-base font-normal rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-gray-900"
      >
        <Power className="w-5 h-5 flex-shrink-0" />
        {(state === 'expanded' || isMobile) && <span className="truncate text-base">Logout</span>}
      </button>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vuoi uscire?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Sì</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarContent>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Lock className="w-6 h-6" />
            Accesso richiesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Inserisci la tua email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci la tua password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
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

  // If not logged in, show login form
  if (!session) {
    return <LoginForm />;
  }

  // Only show sidebar if logged in
  return (
    <SidebarProvider defaultOpen={false} hoverToExpand={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-end p-2">
              <SidebarTrigger className="md:hidden" />
            </div>
            <SidebarMenuContent />
          </div>
        </Sidebar>
        <main className="flex-1 w-full min-h-screen bg-gray-100 p-0 md:p-8 relative md:pt-0">
          <Layout>{children}</Layout>
        </main>
      </div>
    </SidebarProvider>
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
            <Route path="/my-visits" element={<MyVisits />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/selling-points" element={<SellingPoints />} />
            <Route path="/people" element={<People />} />
            <Route path="/activities" element={<Activities />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;