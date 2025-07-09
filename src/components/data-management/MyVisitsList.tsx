import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Visit {
  id: string;
  visitDate: string;
  activity: { name: string } | null;
  supplierCompany: { name: string } | null;
  sellingPoint: { name: string } | null;
}

const MyVisitsList: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user);
      if (!user) {
        setError('Utente non autenticato.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visitDate,
          activity:activityId ( name ),
          supplierCompany:supplierCompanyId ( name ),
          sellingPoint:sellingPointId ( name )
        `)
        .eq('agentId', user.id)
        .order('visitDate', { ascending: false });
      console.log('Visits data:', data);
      console.log('Visits error:', error);
      if (error) {
        setError('Errore nel caricamento delle visite.');
        setLoading(false);
        return;
      }
      setVisits(data || []);
      setLoading(false);
    };
    fetchVisits();
  }, []);

  console.log('Component state:', { loading, error, visitsCount: visits.length });

  return (
    <Card className="overflow-x-hidden">
      <CardContent>
        {loading ? (
          <p>Caricamento visite...</p>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attività</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azienda</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punto Vendita</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visit.visitDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.activity?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.supplierCompany?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.sellingPoint?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {visits.length === 0 && !loading && !error && <p>Nessuna visita trovata.</p>}
      </CardContent>
    </Card>
  );
};

export default MyVisitsList; 