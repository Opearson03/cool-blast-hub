import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, File, Loader2 } from 'lucide-react';

interface PlanUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function PlanUploader({ onUpload, isUploading }: PlanUploaderProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      onUpload(file);
    }
  }, [onUpload]);

  const isValidFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    return validTypes.includes(file.type);
  };

  return (
    <Card
      className={`
        border-2 border-dashed transition-colors
        ${isUploading ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
      `}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {isUploading ? (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Uploading plan...</p>
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <FileImage className="h-8 w-8 text-muted-foreground" />
              <File className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Upload Building Plans</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop a PDF or image, or click to browse
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Supported: PDF, PNG, JPG (max 20MB)
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
