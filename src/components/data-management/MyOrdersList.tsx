import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { usePerformanceTracking } from '@/lib/performance';
import { useUserOrders } from '@/hooks/use-data';
import { DataFilters } from '@/components/ui/data-filter';

interface MyOrdersListProps {
  filters?: DataFilters;
}

const MyOrdersList: React.FC<MyOrdersListProps> = ({ filters = {} }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const { trackRender, trackInteraction } = usePerformanceTracking('MyOrdersList');

  useEffect(() => {
    const endTimer = trackRender();
    return () => endTimer();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const endTimer = trackInteraction('fetch_user');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      endTimer();
    };
    fetchUser();
  }, []);

  const { data: orders = [], isLoading, error } = useUserOrders(userId || '', filters);

  if (isLoading) {
    return (
      <Card className="overflow-x-hidden">
        <CardContent className="p-4">
          <div className="text-center py-8">Caricamento ordini...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-x-hidden">
        <CardContent className="p-4">
          <div className="text-center py-8 text-red-600">
            Errore nel caricamento degli ordini: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-hidden">
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fornitore
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Punto Vendita
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Note
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stato
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {orders.length > 0 ? (
                orders.map((order) => (
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
                      <Badge variant={order.isActive ? "default" : "secondary"}>
                        {order.isActive ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Nessun ordine trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyOrdersList; 