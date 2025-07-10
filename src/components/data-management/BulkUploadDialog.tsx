import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

/**
 * Props for the BulkUploadDialog component.
 */
interface BulkUploadDialogProps {
  /** The user-friendly name of the entity being uploaded (e.g., "Companies", "Punti Vendita"). */
  entityName: string;
  /** Controls whether the dialog is open or closed. */
  isOpen: boolean;
  /** Callback function to close the dialog. */
  onClose: () => void;
  /** Callback function triggered when the "Download Template" button is clicked. */
  onDownloadTemplate: () => void;
  /** Callback function triggered when a file is selected for upload. */
  onFileUpload: (file: File) => void;
}

/**
 * A reusable dialog component for handling bulk data uploads via XLSX files.
 * It provides options to download a template and upload a completed file.
 */
const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({
  entityName,
  isOpen,
  onClose,
  onDownloadTemplate,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset the file input to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload: {entityName}</DialogTitle>
          <DialogDescription>
            Download the template, fill it with your data, and then upload the
            completed file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Ensure your data matches the structure provided in the template.
            All entries in the file will be processed as a single transaction.
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDownloadTemplate}>
            Download Template
          </Button>
          <Button onClick={handleUploadClick}>Upload File</Button>
          <DialogClose asChild>
            <Button variant="ghost" onClick={onClose} className="sm:hidden">Cancel</Button>
          </DialogClose>
        </DialogFooter>
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
