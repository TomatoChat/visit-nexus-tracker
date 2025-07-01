
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Building, Users, Activity, CheckCircle } from 'lucide-react';
import { CompanySelector } from '@/components/visit/CompanySelector';
import { SellingPointSelector } from '@/components/visit/SellingPointSelector';
import { ActivitySelector } from '@/components/visit/ActivitySelector';
import { PersonSelector } from '@/components/visit/PersonSelector';
import { VisitSummary } from '@/components/visit/VisitSummary';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VisitData {
  supplierCompanyId: string;
  sellerCompanyId: string;
  sellingPointId: string;
  activityId: string;
  personVisitedId?: string;
  agentId: string;
  visitDate: string;
}

const VisitTracker = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [visitData, setVisitData] = useState<Partial<VisitData>>({
    visitDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: 'Supplier Company', icon: Building, description: 'Company performing the visit' },
    { number: 2, title: 'Seller Company', icon: Building, description: 'Company being visited' },
    { number: 3, title: 'Selling Point', icon: MapPin, description: 'Location of the visit' },
    { number: 4, title: 'Activity', icon: Activity, description: 'Type of visit activity' },
    { number: 5, title: 'Person Visited', icon: Users, description: 'Contact person (optional)' },
    { number: 6, title: 'Review', icon: CheckCircle, description: 'Confirm visit details' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!visitData.supplierCompanyId || !visitData.sellingPointId || !visitData.activityId || !visitData.agentId) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('visits')
        .insert([{
          supplierCompanyId: visitData.supplierCompanyId,
          sellingPointId: visitData.sellingPointId,
          activityId: visitData.activityId,
          personVisitedId: visitData.personVisitedId || null,
          agentId: visitData.agentId,
          visitDate: visitData.visitDate
        }]);

      if (error) throw error;

      toast({
        title: "Visit Recorded",
        description: "Your visit has been successfully recorded!",
      });

      // Reset form
      setVisitData({ visitDate: new Date().toISOString().split('T')[0] });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error submitting visit:', error);
      toast({
        title: "Error",
        description: "Failed to record visit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanySelector
            type="supplier"
            selectedCompanyId={visitData.supplierCompanyId}
            onSelect={(companyId) => setVisitData({ ...visitData, supplierCompanyId: companyId })}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <CompanySelector
            type="seller"
            selectedCompanyId={visitData.sellerCompanyId}
            onSelect={(companyId) => setVisitData({ ...visitData, sellerCompanyId: companyId })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <SellingPointSelector
            supplierCompanyId={visitData.supplierCompanyId!}
            selectedSellingPointId={visitData.sellingPointId}
            onSelect={(sellingPointId, agentId) => setVisitData({ 
              ...visitData, 
              sellingPointId,
              agentId 
            })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ActivitySelector
            selectedActivityId={visitData.activityId}
            onSelect={(activityId) => setVisitData({ ...visitData, activityId })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <PersonSelector
            sellingPointId={visitData.sellingPointId!}
            selectedPersonId={visitData.personVisitedId}
            onSelect={(personId) => setVisitData({ ...visitData, personVisitedId: personId })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <VisitSummary
            visitData={visitData as VisitData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Visit Tracker</h1>
          <p className="text-gray-600">Record your business visits</p>
        </div>

        {/* Progress Steps */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    step.number === currentStep
                      ? 'bg-blue-600 text-white'
                      : step.number < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.number < currentStep ? '✓' : step.number}
                </div>
              ))}
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Step {currentStep} of {steps.length}
              </Badge>
              <h2 className="font-semibold text-lg">{steps[currentStep - 1].title}</h2>
              <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-4">
          {renderStepContent()}
        </div>

        {/* Visit Date */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Visit Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={visitData.visitDate}
                onChange={(e) => setVisitData({ ...visitData, visitDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VisitTracker;
