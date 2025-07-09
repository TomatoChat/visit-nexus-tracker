import { useEffect, useState } from "react";
import { NewVisitForm } from "@/components/visit/NewVisitForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { DatabaseZap } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Add this TypeScript declaration to fix the linter error for import.meta.env
interface ImportMeta {
  env: {
    VITE_LOGIN_PASSWORD: string;
    [key: string]: string;
  };
}

const PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD;

const Index = () => {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  if (session) {
    return (
      <div className="min-h-screen pt-4 md:pt-0">
        <div className="w-full md:max-w-4xl mx-auto px-2 md:px-0 mt-0 lg:mt-8">
          {/* Mobile: Sidebar button and title row */}
          <div className="flex flex-row items-center gap-2 md:hidden mb-4">
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-gray-800">Nuovo Rapporto Visita</h1>
          </div>
          {/* Desktop: Title */}
          <div className="hidden md:flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 text-left">Nuovo Rapporto Visita</h1>
          </div>
          <NewVisitForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-8">
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
};

export default Index;
