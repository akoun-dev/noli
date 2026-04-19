import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { insurerLogoService } from '@/features/admin/services/insurerLogoService';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface LogoUploaderProps {
  insurerId?: string;
  currentLogo?: string | null;
  insurerName: string;
  onLogoUploaded?: (url: string) => void;
  onLogoDeleted?: () => void;
  disabled?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  insurerId,
  currentLogo,
  insurerName,
  onLogoUploaded,
  onLogoDeleted,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !insurerId) return;

    // Validation du type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non autorisé. Utilisez PNG, JPEG, WEBP ou SVG');
      return;
    }

    // Validation de la taille
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Taille du fichier trop grande. Maximum: 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Créer un preview local
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Uploader le fichier
      const result = await insurerLogoService.uploadLogo(insurerId, file);

      setPreviewUrl(result.url);
      toast.success('Logo uploadé avec succès');
      onLogoUploaded?.(result.url);

      logger.info(`Logo uploadé pour ${insurerName}: ${result.url}`);
    } catch (error) {
      logger.error('Erreur upload logo:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload du logo');
      setPreviewUrl(currentLogo || null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!insurerId) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce logo ?')) {
      return;
    }

    try {
      await insurerLogoService.deleteLogo(insurerId);
      setPreviewUrl(null);
      toast.success('Logo supprimé');
      onLogoDeleted?.();
      logger.info(`Logo supprimé pour ${insurerName}`);
    } catch (error) {
      logger.error('Erreur suppression logo:', error);
      toast.error('Erreur lors de la suppression du logo');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Logo de l'assureur</label>
          {previewUrl && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Preview du logo */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs text-gray-600">{uploadProgress}%</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={`Logo ${insurerName}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs">PNG, JPG, WEBP</span>
              </div>
            )}
          </div>

          {/* Info et upload */}
          <div className="flex-1 space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Taille maximale: 5MB</p>
              <p>Formats acceptés: PNG, JPG, WEBP, SVG</p>
            </div>

            {!disabled && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {previewUrl ? 'Changer le logo' : 'Uploader un logo'}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {previewUrl && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Logo enregistré avec succès</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LogoUploader;
