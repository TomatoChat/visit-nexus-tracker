import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';

// Types
type Company = Database['public']['Tables']['companies']['Row'];
type Person = Database['public']['Tables']['people']['Row'] & {
  companies: Database['public']['Tables']['companies']['Row'] | null;
  sellingPoints: Database['public']['Tables']['sellingPoints']['Row'] | null;
  personRoles: Database['public']['Tables']['personRoles']['Row'] | null;
};
type SellingPoint = Database['public']['Tables']['sellingPoints']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'];
  companies?: Database['public']['Tables']['companies']['Row'];
};
type Activity = Database['public']['Tables']['visitActivities']['Row'];
type PersonRole = Database['public']['Tables']['personRoles']['Row'];
type Address = Database['public']['Tables']['addresses']['Row'];
type Visit = Database['public']['Tables']['visits']['Row'] & {
  activity?: { name: string };
  supplierCompany?: { name: string };
  sellingPoint?: { name: string };
};
type CompanyCategory = Database['public']['Tables']['companyCategories']['Row'];

// Query Keys
export const queryKeys = {
  companies: ['companies'] as const,
  people: ['people'] as const,
  sellingPoints: ['sellingPoints'] as const,
  activities: ['activities'] as const,
  personRoles: ['personRoles'] as const,
  addresses: ['addresses'] as const,
  visits: ['visits'] as const,
  suppliers: ['suppliers'] as const,
  sellers: ['sellers'] as const,
  companyCategories: ['companyCategories'] as const,
  sellingPointsBySeller: (sellerId: string) => ['sellingPoints', 'seller', sellerId] as const,
  sellingPointsBySupplier: (supplierId: string, sellerId: string) => 
    ['sellingPoints', 'supplier', supplierId, 'seller', sellerId] as const,
  peopleByCompanies: (companyIds: string[]) => ['people', 'companies', companyIds] as const,
  addressesBySearch: (search: string) => ['addresses', 'search', search] as const,
  userVisits: (userId: string) => ['visits', 'user', userId] as const,
  companySellingPoints: (sellingPointId: string) => ['companySellingPoints', sellingPointId] as const,
};

// Companies
export const useCompanies = () => {
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('isActive', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Company[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Company Categories
export const useCompanyCategories = () => {
  return useQuery({
    queryKey: queryKeys.companyCategories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companyCategories')
        .select('*')
        .eq('isactive', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as CompanyCategory[];
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: queryKeys.suppliers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('isSupplier', true)
        .eq('isActive', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Company[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSellers = () => {
  return useQuery({
    queryKey: queryKeys.sellers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('isSeller', true)
        .eq('isActive', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Company[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSellersBySupplier = (supplierId: string) => {
  return useQuery({
    queryKey: ['sellers', 'supplier', supplierId],
    queryFn: async () => {
      console.log('🔍 Debugging useSellersBySupplier for supplierId:', supplierId);
      
      // Use efficient batching approach to get all results
      console.log('🔍 Starting batched query approach...');
      
      return await getSellersBySupplierBatched(supplierId);
    },
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Efficient batching function
async function getSellersBySupplierBatched(supplierId: string): Promise<Company[]> {
  console.log('🔄 Using batched approach...');
  
  // Get relationships in batches
  const batchSize = 100;
  let allSellingPointIds: string[] = [];
  let offset = 0;
  
  while (true) {
    const { data: relationships, error: relationshipsError } = await supabase
      .from('companySellingPoint')
      .select('sellingPointId')
      .eq('supplierCompanyId', supplierId)
      .eq('isactive', true)
      .range(offset, offset + batchSize - 1);

    if (relationshipsError) {
      console.error('❌ Error fetching relationships batch:', relationshipsError);
      throw relationshipsError;
    }

    if (!relationships || relationships.length === 0) break;
    
    allSellingPointIds.push(...relationships.map(rel => rel.sellingPointId));
    offset += batchSize;
    
    console.log(`🔄 Processed batch, total IDs so far: ${allSellingPointIds.length}`);
  }

  console.log('🔍 Total selling point IDs found:', allSellingPointIds.length);

  if (allSellingPointIds.length === 0) {
    console.log('⚠️ No selling point IDs found, returning empty array');
    return [];
  }

  // Get selling points in batches
  const sellerCompanyIds = new Set<string>();
  const sellingPointBatchSize = 50;
  
  for (let i = 0; i < allSellingPointIds.length; i += sellingPointBatchSize) {
    const batch = allSellingPointIds.slice(i, i + sellingPointBatchSize);
    
    const { data: sellingPoints, error: sellingPointsError } = await supabase
      .from('sellingPoints')
      .select('sellerCompanyId')
      .in('id', batch)
      .eq('isactive', true);

    if (sellingPointsError) {
      console.error('❌ Error fetching selling points batch:', sellingPointsError);
      throw sellingPointsError;
    }

    if (sellingPoints) {
      sellingPoints.forEach(sp => sellerCompanyIds.add(sp.sellerCompanyId));
    }
    console.log(`🔄 Processed selling points batch ${Math.floor(i/sellingPointBatchSize) + 1}, unique companies so far: ${sellerCompanyIds.size}`);
  }

  const uniqueSellerCompanyIds = Array.from(sellerCompanyIds);
  console.log('🏢 Found', uniqueSellerCompanyIds.length, 'unique seller companies');

  if (uniqueSellerCompanyIds.length === 0) {
    console.log('⚠️ No seller company IDs found, returning empty array');
    return [];
  }

  // Get the seller companies
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, isSeller, isActive')
    .eq('isSeller', true)
    .eq('isActive', true)
    .in('id', uniqueSellerCompanyIds)
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching companies:', error);
    throw error;
  }

  console.log('✅ Batched query result - companies found:', data?.length || 0);
  return data as Company[];
}

// People
export const usePeople = () => {
  return useQuery({
    queryKey: queryKeys.people,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          companies (*),
          sellingPoints (*),
          personRoles (*)
        `)
        .eq('isActive', true)
        .order('surname', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Person[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePeopleByCompanies = (companyIds: string[]) => {
  return useQuery({
    queryKey: queryKeys.peopleByCompanies(companyIds),
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .in('companyId', companyIds)
        .eq('isActive', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Person[];
    },
    enabled: companyIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
};

// Selling Points
export const useSellingPoints = () => {
  return useQuery({
    queryKey: queryKeys.sellingPoints,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellingPoints')
        .select(`
          *,
          addresses (*),
          companies!sellingPoints_sellerCompanyId_fkey (*)
        `)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as SellingPoint[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSellingPointsBySeller = (sellerId: string) => {
  return useQuery({
    queryKey: queryKeys.sellingPointsBySeller(sellerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellingPoints')
        .select('*')
        .eq('sellerCompanyId', sellerId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as SellingPoint[];
    },
    enabled: !!sellerId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useSellingPointsBySupplier = (supplierId: string, sellerId: string) => {
  return useQuery({
    queryKey: queryKeys.sellingPointsBySupplier(supplierId, sellerId),
    queryFn: async () => {
      console.log('🔍 Optimizing useSellingPointsBySupplier for supplierId:', supplierId, 'sellerId:', sellerId);
      
      // Use efficient batching approach to get all results
      console.log('🔍 Starting batched selling points query...');
      
      return await getSellingPointsBySupplierBatched(supplierId, sellerId);
    },
    enabled: !!supplierId && !!sellerId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Efficient batching function for selling points
async function getSellingPointsBySupplierBatched(supplierId: string, sellerId: string): Promise<SellingPoint[]> {
  console.log('🔄 Using batched approach for selling points...');
  
  // Get relationships in batches
  const batchSize = 100;
  let allSellingPointIds: string[] = [];
  let offset = 0;
  
  while (true) {
    const { data: relationships, error: relationshipsError } = await supabase
      .from('companySellingPoint')
      .select('sellingPointId')
      .eq('supplierCompanyId', supplierId)
      .eq('isactive', true)
      .range(offset, offset + batchSize - 1);

    if (relationshipsError) {
      console.error('❌ Error fetching relationships batch:', relationshipsError);
      throw relationshipsError;
    }

    if (!relationships || relationships.length === 0) break;
    
    allSellingPointIds.push(...relationships.map(rel => rel.sellingPointId));
    offset += batchSize;
    
    console.log(`🔄 Processed relationships batch, total IDs so far: ${allSellingPointIds.length}`);
  }

  console.log('🔍 Total selling point IDs found:', allSellingPointIds.length);

  if (allSellingPointIds.length === 0) {
    console.log('⚠️ No selling point IDs found, returning empty array');
    return [];
  }

  // Get selling points with addresses in batches
  const allSellingPoints: SellingPoint[] = [];
  const sellingPointBatchSize = 50;
  
  for (let i = 0; i < allSellingPointIds.length; i += sellingPointBatchSize) {
    const batch = allSellingPointIds.slice(i, i + sellingPointBatchSize);
    
    const { data: sellingPoints, error: sellingPointsError } = await supabase
      .from('sellingPoints')
      .select('*, addresses(*)')
      .eq('sellerCompanyId', sellerId)
      .in('id', batch)
      .eq('isactive', true)
      .order('name', { ascending: true });

    if (sellingPointsError) {
      console.error('❌ Error fetching selling points batch:', sellingPointsError);
      throw sellingPointsError;
    }

    if (sellingPoints) {
      allSellingPoints.push(...sellingPoints);
    }
    console.log(`🔄 Processed selling points batch ${Math.floor(i/sellingPointBatchSize) + 1}, total so far: ${allSellingPoints.length}`);
  }

  console.log('✅ Batched selling points query result - selling points found:', allSellingPoints.length);
  return allSellingPoints as SellingPoint[];
}

// Activities
export const useActivities = () => {
  return useQuery({
    queryKey: queryKeys.activities,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitActivities')
        .select('*')
        .eq('isactive', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Activity[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - activities don't change often
    gcTime: 30 * 60 * 1000,
  });
};

// Person Roles
export const usePersonRoles = () => {
  return useQuery({
    queryKey: queryKeys.personRoles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personRoles')
        .select('*')
        .eq('isactive', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as PersonRole[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Addresses
export const useAddressesBySearch = (search: string) => {
  return useQuery({
    queryKey: queryKeys.addressesBySearch(search),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('id, addressLine1, city')
        .eq('isactive', true)
        .or(`addressLine1.ilike.%${search}%,city.ilike.%${search}%`)
        .limit(20);
      if (error) throw error;
      return data as Address[];
    },
    enabled: search.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

// Visits
export const useUserVisits = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userVisits(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visitDate,
          activity:activityId ( name ),
          supplierCompany:supplierCompanyId ( name ),
          sellingPoint:sellingPointId ( name )
        `)
        .eq('agentId', userId)
        .order('visitDate', { ascending: false });
      if (error) throw error;
      return data as Visit[];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Mutations
export const useCreatePerson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personData: Database['public']['Tables']['people']['Insert']) => {
      const { data, error } = await supabase
        .from('people')
        .insert(personData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people });
    },
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...personData }: { id: string } & Database['public']['Tables']['people']['Update']) => {
      const { data, error } = await supabase
        .from('people')
        .update(personData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people });
    },
  });
};

export const useDeletePerson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase
        .from('people')
        .update({ isActive: false })
        .eq('id', personId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people });
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyData: Database['public']['Tables']['companies']['Insert']) => {
      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
      queryClient.invalidateQueries({ queryKey: queryKeys.sellers });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...companyData }: { id: string } & Database['public']['Tables']['companies']['Update']) => {
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
      queryClient.invalidateQueries({ queryKey: queryKeys.sellers });
    },
  });
};

export const useCreateVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (visitData: Database['public']['Tables']['visits']['Insert']) => {
      const { data, error } = await supabase
        .from('visits')
        .insert(visitData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate user visits for the current user
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      return data;
    },
  });
};

export const useUploadPhotos = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ visitId, photos }: { visitId: string; photos: File[] }) => {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const timestamp = Date.now();
        const fileExtension = photo.name.split('.').pop() || 'jpg';
        const fileName = `${visitId}_${timestamp}_${i}.${fileExtension}`;
        const filePath = `${visitId}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('visits-photos')
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('visits-photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Insert photo records into database
      const photoRecords = uploadedUrls.map((url, index) => ({
        visitId,
        photoUrl: url,
        fileName: photos[index].name,
        fileSize: photos[index].size,
        mimeType: photos[index].type
      }));

      const { data: dbData, error: dbError } = await supabase
        .from('visitPhotos')
        .insert(photoRecords)
        .select();

      if (dbError) throw dbError;

      return dbData;
    },
    onSuccess: () => {
      // Invalidate visits to refresh any visit-related data
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
    },
  });
};

// Company-Selling Point Relationships
export const useCompanySellingPoints = (sellingPointId: string) => {
  return useQuery({
    queryKey: queryKeys.companySellingPoints(sellingPointId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companySellingPoint')
        .select(`
          *,
          supplierCompany:supplierCompanyId (*)
        `)
        .eq('sellingPointId', sellingPointId)
        .eq('isactive', true)
        .order('startDate', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellingPointId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useCreateCompanySellingPoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Database['public']['Tables']['companySellingPoint']['Insert']) => {
      const { data: result, error } = await supabase
        .from('companySellingPoint')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companySellingPoints(variables.sellingPointId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sellingPoints });
    },
  });
};

export const useUpdateCompanySellingPoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Database['public']['Tables']['companySellingPoint']['Update']) => {
      const { data: result, error } = await supabase
        .from('companySellingPoint')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      if (variables.sellingPointId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.companySellingPoints(variables.sellingPointId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sellingPoints });
    },
  });
};

export const useDeleteCompanySellingPoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, sellingPointId }: { id: string; sellingPointId: string }) => {
      const { error } = await supabase
        .from('companySellingPoint')
        .update({ 
          endDate: new Date().toISOString().split('T')[0],
          isactive: false 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companySellingPoints(variables.sellingPointId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sellingPoints });
    },
  });
};

// Fetch all users (id, email) for accountManager selection
export const useAllUsers = () => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabaseAny = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('user_roles_with_name')
        .select('userId, first_name, last_name, auth_email')
        .eq('isActive', true);
      if (error) throw error;
      return (data || []).map((item: any) => {
        const displayName = [item.first_name, item.last_name].filter(Boolean).join(' ');
        return {
          id: item.userId,
          displayName: displayName || item.auth_email || 'Senza nome',
        };
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export type { Activity, PersonRole, CompanyCategory }; 