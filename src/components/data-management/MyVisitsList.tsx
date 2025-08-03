import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useUserVisits } from '@/hooks/use-data';
import { formatDateShort } from '@/lib/date-utils';
import { usePerformanceTracking } from '@/lib/performance';
import { DataFilters } from '@/components/ui/data-filter';

interface MyVisitsListProps {
  filters?: DataFilters;
}

const MyVisitsList: React.FC<MyVisitsListProps> = ({ filters = {} }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const { trackRender, trackInteraction } = usePerformanceTracking('MyVisitsList');

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

  const { data: visits = [], isLoading, error } = useUserVisits(userId || '', filters);

  if (isLoading) {
    return (
      <Card className="overflow-x-hidden">
        <CardContent className="p-4">
          <div className="text-center py-8">Caricamento visite...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-x-hidden">
        <CardContent className="p-4">
          <div className="text-center py-8 text-red-600">
            Errore nel caricamento delle visite: {error.message}
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
                  Attività
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Azienda
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Punto Vendita
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDateShort(visit.visitDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {visit.activity?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {visit.supplierCompany?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {visit.sellingPoint?.name || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Nessuna visita trovata
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

export default MyVisitsList; 