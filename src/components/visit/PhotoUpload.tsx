import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploadProgress?: number;
}

interface PhotoUploadProps {
  visitId?: string;
  onPhotosChange?: (photos: PhotoFile[]) => void;
  disabled?: boolean;
}

export interface PhotoUploadRef {
  uploadPhotos: () => Promise<string[]>;
}

export const PhotoUpload = forwardRef<PhotoUploadRef, PhotoUploadProps>(({ 
  visitId, 
  onPhotosChange, 
  disabled = false 
}, ref) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  useImperativeHandle(ref, () => ({
    uploadPhotos
  }));

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoFile[] = Array.from(files).map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      uploaded: false
    }));

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
  };

  const handleGalleryUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const removePhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    // Only allow removal if photo hasn't been uploaded yet
    if (photo && !photo.uploaded) {
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
    }
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!visitId || photos.length === 0) {
      console.log('No visitId or photos to upload');
      return [];
    }

    console.log('Starting photo upload for visitId:', visitId);
    console.log('Photos to upload:', photos.length);
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.uploaded) {
          console.log('Photo already uploaded, skipping:', photo.id);
          continue;
        }

        // Create a unique filename
        const timestamp = Date.now();
        const fileExtension = photo.file.name.split('.').pop() || 'jpg';
        const fileName = `${visitId}_${timestamp}_${i}.${fileExtension}`;
        const filePath = `${visitId}/${fileName}`;

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
        const updatedPhotos = photos.map(p => 
          p.id === photo.id 
            ? { ...p, uploaded: true, uploadProgress: 100 }
            : p
        );
        setPhotos(updatedPhotos);
        onPhotosChange?.(updatedPhotos);
      }

      console.log('All photos uploaded to storage, inserting database records...');

      // Insert photo records into database
      const photoRecords = uploadedUrls.map((url, index) => ({
        visitId,
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

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Foto della visita</span>
      </div>

      {/* Upload Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleGalleryUpload}
          disabled={disabled || isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Carica foto
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCameraCapture}
          disabled={disabled || isUploading}
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Scatta foto
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="relative">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={photo.preview}
                    alt="Photo preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  {/* Show delete button only for non-uploaded photos */}
                  {!photo.uploaded && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePhoto(photo.id)}
                      disabled={isUploading}
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  {photo.uploaded && (
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                      ✓
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {photo.file.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="text-sm text-muted-foreground">
          Caricamento foto in corso...
        </div>
      )}

    </div>
  );
}); 