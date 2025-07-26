import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateForDatabase, formatDateShort } from '@/lib/date-utils';
import { 
  useSuppliers, 
  useCompanySellingPoints, 
  useCreateCompanySellingPoint, 
  useUpdateCompanySellingPoint, 
  useDeleteCompanySellingPoint 
} from '@/hooks/use-data';
import type { Database } from '@/integrations/supabase/types';

type CompanySellingPoint = Database['public']['Tables']['companySellingPoint']['Row'] & {
  supplierCompany: Database['public']['Tables']['companies']['Row'];
};

interface SupplierRelationshipsProps {
  sellingPointId: string;
  sellingPointName: string;
}

const SupplierRelationships: React.FC<SupplierRelationshipsProps> = ({ 
  sellingPointId, 
  sellingPointName 
}) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<CompanySellingPoint | null>(null);
  
  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sellerCode, setSellerCode] = useState<string>('');
  const [visitCadence, setVisitCadence] = useState<number | undefined>(undefined);

  // Data hooks
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: relationships = [], isLoading: isLoadingRelationships } = useCompanySellingPoints(sellingPointId);
  
  // Mutations
  const createRelationshipMutation = useCreateCompanySellingPoint();
  const updateRelationshipMutation = useUpdateCompanySellingPoint();
  const deleteRelationshipMutation = useDeleteCompanySellingPoint();

  const supplierOptions = suppliers.map(supplier => ({
    value: supplier.id,
    label: supplier.name
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplierId || !startDate) {
      toast({ 
        title: 'Errore di validazione', 
        description: 'Fornitore e data di inizio sono obbligatori.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const relationshipData = {
        supplierCompanyId: selectedSupplierId,
        sellingPointId,
        startDate: formatDateForDatabase(startDate),
        endDate: endDate ? formatDateForDatabase(endDate) : null,
        sellerSellingPointCode: sellerCode || null,
        visitCadence: visitCadence || null,
      };

      if (editingRelationship) {
        await updateRelationshipMutation.mutateAsync({
          id: editingRelationship.id,
          ...relationshipData
        });
        toast({ title: 'Successo!', description: 'Relazione aggiornata!' });
      } else {
        await createRelationshipMutation.mutateAsync(relationshipData);
        toast({ title: 'Successo!', description: 'Relazione creata!' });
      }

      resetForm();
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Impossibile salvare la relazione.', 
        variant: 'destructive' 
      });
    }
  };

  const handleEdit = (relationship: CompanySellingPoint) => {
    setEditingRelationship(relationship);
    setSelectedSupplierId(relationship.supplierCompanyId);
    setStartDate(new Date(relationship.startDate));
    setEndDate(relationship.endDate ? new Date(relationship.endDate) : undefined);
    setSellerCode(relationship.sellerSellingPointCode || '');
    setVisitCadence(relationship.visitCadence || undefined);
    setShowAddForm(true);
  };

  const handleDelete = async (relationship: CompanySellingPoint) => {
    if (!confirm('Sei sicuro di voler terminare questa relazione? Verrà impostata la data di fine a oggi.')) return;

    try {
      await deleteRelationshipMutation.mutateAsync({
        id: relationship.id,
        sellingPointId
      });
      toast({ title: 'Successo!', description: 'Relazione terminata con data di fine!' });
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Impossibile terminare la relazione.', 
        variant: 'destructive' 
      });
    }
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setStartDate(new Date());
    setEndDate(undefined);
    setSellerCode('');
    setVisitCadence(undefined);
    setEditingRelationship(null);
    setShowAddForm(false);
  };

  if (showAddForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {editingRelationship ? 'Modifica Relazione Fornitore' : 'Nuova Relazione Fornitore'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="supplier">Fornitore <span className="text-red-500">*</span></Label>
              <SearchableSelect
                options={supplierOptions}
                value={selectedSupplierId}
                onSelect={(val) => setSelectedSupplierId(Array.isArray(val) ? val[0] : val)}
                placeholder="Seleziona fornitore..."
                searchPlaceholder="Cerca fornitori..."
                disabled={isLoadingSuppliers}
              />
            </div>

            <div className="space-y-2">
              <Label>Data di inizio <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: it }) : <span>Scegli una data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data di fine (opzionale)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: it }) : <span>Scegli una data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date <= startDate}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="seller-code">Codice punto vendita fornitore</Label>
              <Input
                id="seller-code"
                value={sellerCode}
                onChange={(e) => setSellerCode(e.target.value)}
                placeholder="Codice opzionale..."
              />
            </div>

            <div>
              <Label htmlFor="visit-cadence">Cadenza Visite (giorni)</Label>
              <Input
                id="visit-cadence"
                type="number"
                min={1}
                value={visitCadence || ''}
                onChange={(e) => setVisitCadence(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Es: 30"
              />
            </div>

            <div className="flex justify-between items-center space-x-2">
              <div>
                {editingRelationship && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(editingRelationship)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
                <Button type="submit">
                  {editingRelationship ? 'Salva Modifiche' : 'Crea Relazione'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Relazioni Fornitori - {sellingPointName}</CardTitle>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Fornitore
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingRelationships ? (
          <p>Caricamento relazioni...</p>
        ) : relationships.length === 0 ? (
          <p className="text-gray-500">Nessuna relazione fornitore configurata.</p>
        ) : (
          <div className="space-y-3">
            {relationships.map((relationship) => (
              <div
                key={relationship.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{relationship.supplierCompany.name}</h4>
                    {relationship.endDate && new Date(relationship.endDate) < new Date() && (
                      <Badge variant="secondary" className="text-xs">Scaduta</Badge>
                    )}
                  </div>
                                     <div className="text-sm text-gray-600 mt-1">
                     <span>Dal: {formatDateShort(relationship.startDate)}</span>
                     {relationship.endDate && (
                       <span className="ml-2">
                         Al: {formatDateShort(relationship.endDate)}
                       </span>
                     )}
                    {relationship.sellerSellingPointCode && (
                      <span className="ml-2">
                        • Codice: {relationship.sellerSellingPointCode}
                      </span>
                    )}
                    {relationship.visitCadence && (
                      <span className="ml-2 text-blue-600">
                        • Cadenza: {relationship.visitCadence} giorni
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(relationship)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(relationship)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierRelationships; 