import React, { useState, useEffect, useMemo } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SellingPointWithCadence {
  id: string;
  name: string;
  address: {
    addressLine1: string | null;
    city: string;
    stateProvince: string;
  };
  lastVisitDate: string | null;
  daysSinceLastVisit: number;
  cadence: number;
  daysUntilDue: number;
  isOverdue: boolean;
  supplierCompany: {
    name: string;
  };
  relationshipCadence: number | null;
  companyDefaultCadence: number | null;
}

const ToVisit: React.FC = () => {
  const { toast } = useToast();
  const [sellingPoints, setSellingPoints] = useState<SellingPointWithCadence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchSellingPointsToVisit();
    }
  }, [userId]);

  const fetchSellingPointsToVisit = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Get selling points assigned to the user (as service person only for now)
      const { data: assignedSellingPoints, error: spError } = await supabase
        .from('sellingPoints')
        .select(`
          id,
          name,
          addresses (
            addressLine1,
            city,
            stateProvince
          ),
          companySellingPoint!companySellingPoint_sellingPointId_fkey (
            supplierCompanyId,
            visitCadence,
            supplierCompany:companies!companySellingPoint_supplierCompanyId_fkey (
              name,
              visitCadence
            )
          ),
          sellingPointServicePeople!sellingPointServicePeople_sellingPointId_fkey (
            userId
          )
        `)
        .eq('sellingPointServicePeople.userId', userId)
        .eq('isactive', true);

      if (spError) throw spError;

      // Get the last visit date for each selling point
      const sellingPointsWithVisits = await Promise.all(
        (assignedSellingPoints || []).map(async (sp: any) => {
          const { data: lastVisit, error: visitError } = await supabase
            .from('visits')
            .select('visitDate')
            .eq('sellingPointId', sp.id)
            .order('visitDate', { ascending: false })
            .limit(1)
            .single();

          if (visitError && visitError.code !== 'PGRST116') {
            console.error('Error fetching last visit:', visitError);
          }

          return {
            ...sp,
            lastVisit: lastVisit?.visitDate || null
          };
        })
      );

      // Process and filter selling points with cadence
      const today = new Date();
      const processedSellingPoints: SellingPointWithCadence[] = [];

      for (const sp of sellingPointsWithVisits) {
        const relationships = sp.companySellingPoint || [];
        
        for (const rel of relationships) {
          if (!rel.supplierCompany) continue;

          // Determine cadence: relationship-specific first, then company default
          const relationshipCadence = rel.visitCadence;
          const companyDefaultCadence = rel.supplierCompany.visitCadence;
          const cadence = relationshipCadence || companyDefaultCadence;

          // Skip if no cadence is set
          if (!cadence) continue;

          // Calculate days since last visit
          let daysSinceLastVisit = 0;
          if (sp.lastVisit) {
            const lastVisitDate = new Date(sp.lastVisit);
            const diffTime = today.getTime() - lastVisitDate.getTime();
            daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
            // If no previous visit, assume it's overdue by the cadence amount
            daysSinceLastVisit = cadence;
          }

          const daysUntilDue = cadence - daysSinceLastVisit;
          const isOverdue = daysUntilDue < 0;

          processedSellingPoints.push({
            id: sp.id,
            name: sp.name,
            address: sp.addresses,
            lastVisitDate: sp.lastVisit,
            daysSinceLastVisit,
            cadence,
            daysUntilDue: Math.abs(daysUntilDue),
            isOverdue,
            supplierCompany: rel.supplierCompany,
            relationshipCadence,
            companyDefaultCadence
          });
        }
      }

      // Sort by urgency: overdue first, then by days until due
      processedSellingPoints.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysUntilDue - b.daysUntilDue;
      });

      setSellingPoints(processedSellingPoints);
    } catch (error: any) {
      console.error('Error fetching selling points to visit:', error);
      toast({ 
        title: 'Errore', 
        description: 'Impossibile caricare i punti vendita da visitare.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSellingPoints = useMemo(() => {
    switch (filter) {
      case 'overdue':
        return sellingPoints.filter(sp => sp.isOverdue);
      case 'upcoming':
        return sellingPoints.filter(sp => !sp.isOverdue);
      default:
        return sellingPoints;
    }
  }, [sellingPoints, filter]);

  const getUrgencyColor = (isOverdue: boolean, daysUntilDue: number) => {
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntilDue <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysUntilDue <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getUrgencyIcon = (isOverdue: boolean, daysUntilDue: number) => {
    if (isOverdue) return <AlertTriangle className="w-4 h-4" />;
    if (daysUntilDue <= 7) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full pb-2 md:p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Caricamento punti vendita da visitare...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full pb-2 md:pb-0">
        {/* Mobile: Sidebar button and title */}
        <div className="flex flex-row items-center justify-between gap-2 md:hidden mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold">Da Visitare</h1>
          </div>
        </div>

        {/* Desktop: Title */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-left">Da Visitare</h1>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tutti ({sellingPoints.length})
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            In Ritardo ({sellingPoints.filter(sp => sp.isOverdue).length})
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Prossimi ({sellingPoints.filter(sp => !sp.isOverdue).length})
          </Button>
        </div>

        {/* Selling Points List */}
        <div className="space-y-4">
          {filteredSellingPoints.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nessun punto vendita da visitare
                  </h3>
                  <p className="text-gray-500">
                    {filter === 'all' 
                      ? 'Tutti i punti vendita assegnati sono aggiornati.'
                      : filter === 'overdue'
                      ? 'Nessun punto vendita in ritardo.'
                      : 'Nessun punto vendita in programma per i prossimi giorni.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredSellingPoints.map((sp) => (
              <Card key={`${sp.id}-${sp.supplierCompany.name}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{sp.name}</h3>
                        <Badge variant="outline" className={getUrgencyColor(sp.isOverdue, sp.daysUntilDue)}>
                          {getUrgencyIcon(sp.isOverdue, sp.daysUntilDue)}
                          <span className="ml-1">
                            {sp.isOverdue 
                              ? `${sp.daysUntilDue} giorni di ritardo`
                              : `${sp.daysUntilDue} giorni rimanenti`
                            }
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span>{sp.supplierCompany.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {sp.address.addressLine1 && `${sp.address.addressLine1}, `}
                            {sp.address.city}, {sp.address.stateProvince}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Ultima visita:</span>
                            <span className="ml-1 font-medium">
                              {sp.lastVisitDate 
                                ? new Date(sp.lastVisitDate).toLocaleDateString('it-IT')
                                : 'Mai visitato'
                              }
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Giorni dall'ultima visita:</span>
                            <span className="ml-1 font-medium">{sp.daysSinceLastVisit}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Cadenza:</span>
                            <span className="ml-1 font-medium">
                              {sp.cadence} giorni
                              {sp.relationshipCadence 
                                ? ' (specifica)'
                                : ' (predefinita)'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ToVisit; 