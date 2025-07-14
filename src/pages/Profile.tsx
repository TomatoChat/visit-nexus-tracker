import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Profile: React.FC = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ email: string } | null>(null);
  
  // Password change form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser({ email: data.user.email ?? '' });
      }
    };
    fetchUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (newPassword.length < 6) {
      toast({ 
        title: 'Errore', 
        description: 'La nuova password deve essere di almeno 6 caratteri.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ 
        title: 'Errore', 
        description: 'Le password non coincidono.', 
        variant: 'destructive' 
      });
      return;
    }

    setPasswordLoading(true);
    
    try {
      // First, re-authenticate the user with their current password
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (reAuthError) {
        toast({ 
          title: 'Errore', 
          description: 'Password attuale non corretta.', 
          variant: 'destructive' 
        });
        setPasswordLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        toast({ 
          title: 'Errore', 
          description: updateError.message, 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Successo', 
          description: 'Password aggiornata con successo!' 
        });
        
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (error) {
      toast({ 
        title: 'Errore', 
        description: 'Si è verificato un errore durante l\'aggiornamento della password.', 
        variant: 'destructive' 
      });
    }
    
    setPasswordLoading(false);
  };

  return (
    <Layout>
      <div className="w-full max-w-md mx-auto mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Profilo Utente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Email</div>
              <div className="font-medium text-lg">{user?.email || '...'}</div>
            </div>
            
            {/* Password Change Section */}
            <div className="pt-4 border-t">
              <div className="font-medium mb-4">Cambia Password</div>
              
              {!showPasswordForm ? (
                <Button 
                  onClick={() => setShowPasswordForm(true)} 
                  variant="outline" 
                  className="w-full"
                >
                  Cambia Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Password Attuale</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Inserisci la password attuale"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">Nuova Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Inserisci la nuova password"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Conferma la nuova password"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={passwordLoading} 
                      className="flex-1"
                    >
                      {passwordLoading ? 'Aggiornamento...' : 'Aggiorna Password'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Annulla
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile; 