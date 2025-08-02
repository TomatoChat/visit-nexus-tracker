import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Trash2, CheckCircle, Clock, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type Order = Database['public']['Tables']['orders']['Row'] & {
  companies?: Database['public']['Tables']['companies']['Row'];
  sellingPoints?: Database['public']['Tables']['sellingPoints']['Row'];
};

interface OrderManagementProps {
  readOnly?: boolean;
  searchTerm?: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ readOnly = false, searchTerm = '' }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userDetails, setUserDetails] = useState<{ [key: string]: { first_name: string; last_name: string; auth_email: string } }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'received'>('pending');
  
  // Search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchTermLocal, setSearchTermLocal] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Confirmation dialogs
  const [showMarkReceivedDialog, setShowMarkReceivedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          companies!orders_suppliercompanyid_fkey(*),
          sellingPoints!orders_sellingpointid_fkey(*)
        `)
        .eq('"isActive"', true)
        .order('"orderDate"', { ascending: false });
      if (error) throw error;
      setOrders(data as Order[] || []);
      
      // Fetch user details from user_roles_with_name view
      const userIds = [...new Set((data || []).map(order => order.userId))];
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('user_roles_with_name')
          .select('userId, first_name, last_name, auth_email')
          .in('userId', userIds);
        
        if (!userError && userData) {
          const userMap: { [key: string]: { first_name: string; last_name: string; auth_email: string } } = {};
          userData.forEach(user => {
            if (user.userId) {
              userMap[user.userId] = { 
                first_name: user.first_name || '', 
                last_name: user.last_name || '', 
                auth_email: user.auth_email || '' 
              };
            }
          });
          setUserDetails(userMap);
        }
      }
    } catch (error: any) {
      toast({ title: 'Error fetching orders', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsReceived = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ received: true })
        .eq('id', order.id);
      
      if (error) throw error;
      
      toast({ title: 'Successo!', description: 'Ordine marcato come ricevuto!' });
      fetchOrders(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || 'Impossibile aggiornare l\'ordine.', variant: 'destructive' });
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ isActive: false })
        .eq('id', order.id);
      
      if (error) throw error;
      
      toast({ title: 'Successo!', description: 'Ordine eliminato con successo!' });
      fetchOrders(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message || 'Impossibile eliminare l\'ordine.', variant: 'destructive' });
    }
  };

  const filteredOrders = useMemo(() => {
    const searchTermToUse = searchTerm || searchTermLocal;
    return orders.filter(order => {
      const searchTermMatch = 
        order.companies?.name?.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
        order.sellingPoints?.name?.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
        userDetails[order.userId]?.auth_email?.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
        `${userDetails[order.userId]?.first_name} ${userDetails[order.userId]?.last_name}`.toLowerCase().includes(searchTermToUse.toLowerCase());

      const statusMatch = activeTab === 'received' ? order.received : !order.received;

      return searchTermMatch && statusMatch;
    });
  }, [orders, searchTerm, searchTermLocal, activeTab, userDetails]);

  return (
    <div className="w-full pb-2 md:pb-0">
      {/* Mobile: Sidebar button, title, and actions */}
      <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">Gestione Ordini</h1>
        </div>
        <div className="flex items-center gap-2">
          {!showSearch && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerca"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          {showSearch && (
            <Input
              ref={searchInputRef}
              autoFocus
              className="w-32"
              placeholder="Cerca..."
              value={searchTermLocal}
              onChange={e => setSearchTermLocal(e.target.value)}
              onBlur={() => setShowSearch(false)}
              onKeyDown={e => {
                if (e.key === 'Escape') setShowSearch(false);
              }}
            />
          )}
        </div>
      </div>
      {/* Desktop: Title and actions */}
      <div className="hidden md:flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-left">Gestione Ordini</h1>
        <div className="flex items-center gap-2">
          {!showSearch && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerca"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          {showSearch && (
            <Input
              ref={searchInputRef}
              autoFocus
              className="w-48"
              placeholder="Cerca ordini..."
              value={searchTermLocal}
              onChange={e => setSearchTermLocal(e.target.value)}
              onBlur={() => setShowSearch(false)}
              onKeyDown={e => {
                if (e.key === 'Escape') setShowSearch(false);
              }}
            />
          )}
        </div>
      </div>
      
      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('pending')}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          In Attesa ({orders.filter(order => !order.received).length})
        </Button>
        <Button
          variant={activeTab === 'received' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('received')}
          className="flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Ricevuti ({orders.filter(order => order.received).length})
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <Card className="overflow-x-hidden">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Data Ordine</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Fornitore</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider max-w-xs">Punto Vendita</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Utente</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Note</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 whitespace-nowrap">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {format(new Date(order.orderDate), 'dd/MM/yyyy', { locale: it })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {order.companies?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {order.sellingPoints?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {userDetails[order.userId] ? `${userDetails[order.userId].first_name} ${userDetails[order.userId].last_name}` : order.userId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {order.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {!readOnly && (
                            <div className="flex gap-2">
                                                          {!order.received && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setShowMarkReceivedDialog(true);
                                }}
                                aria-label="Marca come ricevuto"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setShowDeleteDialog(true);
                              }}
                              aria-label="Elimina"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-8">
                  Nessun ordine {activeTab === 'pending' ? 'in attesa' : 'ricevuto'} trovato.
                </p>
              )}
                      </CardContent>
        </Card>
      )}

      {/* Mark as Received Confirmation Dialog */}
      <AlertDialog open={showMarkReceivedDialog} onOpenChange={setShowMarkReceivedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Azione</AlertDialogTitle>
            <AlertDialogDescription>
              Confermi di voler marcare questo ordine come ricevuto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedOrder) {
                  handleMarkAsReceived(selectedOrder);
                  setSelectedOrder(null);
                }
              }}
            >
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo ordine? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedOrder) {
                  handleDeleteOrder(selectedOrder);
                  setSelectedOrder(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderManagement; 