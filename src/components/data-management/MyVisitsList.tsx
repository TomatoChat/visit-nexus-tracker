import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUserVisits } from '@/hooks/use-data';
import { formatDateShort } from '@/lib/date-utils';
import { usePerformanceTracking } from '@/lib/performance';

interface Visit {
  id: string;
  visitDate: string;
  activity: { name: string } | null;
  supplierCompany: { name: string } | null;
  sellingPoint: { name: string } | null;
}

const MyVisitsList: React.FC = () => {
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

  const { data: visits = [], isLoading, error } = useUserVisits(userId || '');

  console.log('Component state:', { isLoading, error, visitsCount: visits.length });

  return (
    <Card className="overflow-x-hidden">
      <CardContent>
        {isLoading ? (
          <p>Caricamento visite...</p>
        ) : error ? (
          <div className="text-red-500">Errore nel caricamento delle visite.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Attività</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Azienda</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Punto Vendita</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{formatDateShort(visit.visitDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{visit.activity?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{visit.supplierCompany?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{visit.sellingPoint?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {visits.length === 0 && !isLoading && !error && <p>Nessuna visita trovata.</p>}
      </CardContent>
    </Card>
  );
};

export default MyVisitsList; 