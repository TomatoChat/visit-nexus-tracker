import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploadProgress?: number;
  error?: string;
}

interface UsePhotoUploadOptions {
  visitId?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (urls: string[]) => void;
  onError?: (error: Error) => void;
}

export const usePhotoUpload = (options: UsePhotoUploadOptions = {}) => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addPhotos = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoFile[] = Array.from(files).map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      uploaded: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo && !photo.uploaded) {
        // Clean up the preview URL
        URL.revokeObjectURL(photo.preview);
        return prev.filter(p => p.id !== photoId);
      }
      return prev;
    });
  }, []);

  const uploadPhotos = useCallback(async (): Promise<string[]> => {
    if (!options.visitId || photos.length === 0) {
      console.log('No visitId or photos to upload');
      return [];
    }

    console.log('Starting photo upload for visitId:', options.visitId);
    console.log('Photos to upload:', photos.length);
    
    setIsUploading(true);
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.uploaded) {
          console.log('Photo already uploaded, skipping:', photo.id);
          continue;
        }

        // Update progress
        const progress = (i / photos.length) * 100;
        setUploadProgress(progress);
        options.onProgress?.(progress);

        // Create a unique filename
        const timestamp = Date.now();
        const fileExtension = photo.file.name.split('.').pop() || 'jpg';
        const fileName = `${options.visitId}_${timestamp}_${i}.${fileExtension}`;
        const filePath = `${options.visitId}/${fileName}`;

        console.log('Uploading photo:', fileName, 'to path:', filePath);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('visits-photos')
          .upload(filePath, photo.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading photo to storage:', error);
          throw error;
        }

        console.log('Photo uploaded to storage successfully:', data);

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('visits-photos')
          .getPublicUrl(filePath);

        console.log('Public URL generated:', urlData.publicUrl);
        uploadedUrls.push(urlData.publicUrl);

        // Update photo status
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, uploaded: true, uploadProgress: 100 }
            : p
        ));
      }

      console.log('All photos uploaded to storage, inserting database records...');

      // Insert photo records into database
      const photoRecords = uploadedUrls.map((url, index) => ({
        visitId: options.visitId!,
        photoUrl: url,
        fileName: photos[index].file.name,
        fileSize: photos[index].file.size,
        mimeType: photos[index].file.type
      }));

      console.log('Photo records to insert:', photoRecords);

      const { data: dbData, error: dbError } = await supabase
        .from('visitPhotos')
        .insert(photoRecords)
        .select();

      if (dbError) {
        console.error('Error inserting photo records:', dbError);
        throw dbError;
      }

      console.log('Photo records inserted successfully:', dbData);

      setUploadProgress(100);
      options.onProgress?.(100);
      options.onComplete?.(uploadedUrls);

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      options.onError?.(error as Error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [photos, options]);

  const clearPhotos = useCallback(() => {
    // Clean up all preview URLs
    photos.forEach(photo => {
      if (!photo.uploaded) {
        URL.revokeObjectURL(photo.preview);
      }
    });
    setPhotos([]);
    setUploadProgress(0);
  }, [photos]);

  return {
    photos,
    isUploading,
    uploadProgress,
    addPhotos,
    removePhoto,
    uploadPhotos,
    clearPhotos
  };
}; 