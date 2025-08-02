import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { usePerformanceTracking } from '@/lib/performance';

interface Order {
  id: string;
  supplierCompanyId: string;
  sellingPointId: string;
  orderDate: string;
  notes: string | null;
  userId: string;
  created_at: string;
  updated_at: string;
  isActive: boolean;
  supplierCompany?: {
    name: string;
  };
  sellingPoint?: {
    name: string;
  };
}

const MyOrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { trackRender, trackInteraction } = usePerformanceTracking('MyOrdersList');

  useEffect(() => {
    const endTimer = trackRender();
    return () => endTimer();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      const endTimer = trackInteraction('load_orders');
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Get selling points where user is account manager
        const { data: accountManagerSellingPoints, error: amError } = await supabase
          .from("sellingPoints")
          .select("id")
          .eq("accountManager", user.id)
          .eq("isactive", true);

        if (amError) throw amError;

        // Get selling points where user is service person
        const { data: serviceSellingPoints, error: spError } = await supabase
          .from("sellingPointServicePeople")
          .select("sellingPointId")
          .eq("userId", user.id)
          .eq("isactive", true);

        if (spError) throw spError;

        // Combine all selling point IDs where user has access
        const userSellingPointIds = [
          ...(accountManagerSellingPoints?.map(sp => sp.id) || []),
          ...(serviceSellingPoints?.map(sp => sp.sellingPointId) || [])
        ];

        // Remove duplicates
        const uniqueSellingPointIds = Array.from(new Set(userSellingPointIds));

        // Build the query
        let query = supabase
          .from("orders")
          .select(`
            *,
            supplierCompany:companies(name),
            sellingPoint:"sellingPoints"(name)
          `)
          .eq("isActive", true);

        // Filter by user's orders OR orders for selling points where user is account manager
        if (uniqueSellingPointIds.length > 0) {
          query = query.or(`userId.eq.${user.id},sellingPointId.in.(${uniqueSellingPointIds.join(',')})`);
        } else {
          // If user has no assigned selling points, only show their own orders
          query = query.eq("userId", user.id);
        }

        const { data, error } = await query.order("orderDate", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error loading orders:", error);
        setError("Impossibile caricare gli ordini");
      } finally {
        setLoading(false);
      }
      endTimer();
    };

    loadOrders();
  }, []);

  return (
    <Card className="overflow-x-hidden">
      <CardContent>
        {loading ? (
          <p>Caricamento ordini...</p>
        ) : error ? (
          <div className="text-red-500">Errore nel caricamento degli ordini.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Azienda Fornitrice</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Punto Vendita</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Note</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Creato</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <Badge variant="secondary">
                          {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: it })}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {order.supplierCompany?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {order.sellingPoint?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {order.notes ? (
                          <div className="max-w-xs truncate" title={order.notes}>
                            {order.notes}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: it })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {orders.length === 0 && !loading && !error && <p>Nessun ordine trovato.</p>}
      </CardContent>
    </Card>
  );
};

export default MyOrdersList; 