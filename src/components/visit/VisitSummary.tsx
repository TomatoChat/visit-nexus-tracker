
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Calendar, Building, MapPin, Activity, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface VisitData {
  supplierCompanyId: string;
  sellerCompanyId: string;
  sellingPointId: string;
  activityId: string;
  personVisitedId?: string;
  agentId: string;
  visitDate: string;
}

interface VisitSummaryProps {
  visitData: VisitData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const VisitSummary: React.FC<VisitSummaryProps> = ({
  visitData,
  onSubmit,
  onBack,
  isSubmitting
}) => {
  const [summaryData, setSummaryData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, [visitData]);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      const [
        { data: supplierCompany },
        { data: sellingPoint },
        { data: activity },
        { data: personVisited },
        { data: agent }
      ] = await Promise.all([
        supabase.from('companies').select('name').eq('id', visitData.supplierCompanyId).single(),
        supabase.from('sellingPoints').select(`
          name,
          companies (name),
          addresses (city, stateProvince)
        `).eq('id', visitData.sellingPointId).single(),
        supabase.from('visitActivities').select('name').eq('id', visitData.activityId).single(),
        visitData.personVisitedId 
          ? supabase.from('people').select('name, surname, email').eq('id', visitData.personVisitedId).single()
          : { data: null },
        supabase.from('people').select('name, surname').eq('id', visitData.agentId).single()
      ]);

      setSummaryData({
        supplierCompany,
        sellingPoint,
        activity,
        personVisited,
        agent
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading summary...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Visit Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Visit Date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">Visit Date</p>
              <p className="text-sm text-gray-600">
                {new Date(visitData.visitDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Agent */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">Agent</p>
              <p className="text-sm text-gray-600">
                {summaryData.agent?.name} {summaryData.agent?.surname}
              </p>
            </div>
          </div>

          {/* Supplier Company */}
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">Supplier Company</p>
              <p className="text-sm text-gray-600">{summaryData.supplierCompany?.name}</p>
            </div>
          </div>

          {/* Selling Point */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">Selling Point</p>
              <p className="text-sm text-gray-600">
                {summaryData.sellingPoint?.name}
              </p>
              <p className="text-xs text-gray-500">
                {summaryData.sellingPoint?.companies?.name} • {' '}
                {summaryData.sellingPoint?.addresses?.city}, {summaryData.sellingPoint?.addresses?.stateProvince}
              </p>
            </div>
          </div>

          {/* Activity */}
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">Activity</p>
              <Badge variant="secondary">{summaryData.activity?.name}</Badge>
            </div>
          </div>

          {/* Person Visited */}
          {summaryData.personVisited && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Person Visited</p>
                <p className="text-sm text-gray-600">
                  {summaryData.personVisited.name} {summaryData.personVisited.surname}
                </p>
                <p className="text-xs text-gray-500">{summaryData.personVisited.email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
            Back
          </Button>
          <Button 
            onClick={onSubmit} 
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Recording...
              </>
            ) : (
              'Record Visit'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
