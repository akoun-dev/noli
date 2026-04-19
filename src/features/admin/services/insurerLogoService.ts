import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const BUCKET_NAME = 'insurer-logos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export interface LogoUploadResult {
  path: string;
  url: string;
}

export class InsurerLogoService {
  /**
   * Upload un logo pour un assureur
   */
  async uploadLogo(insurerId: string, file: File): Promise<LogoUploadResult> {
    try {
      // Validation du fichier
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Type de fichier non autorisé. Types acceptés: PNG, JPEG, WEBP, SVG');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Taille du fichier trop grande. Maximum: 5MB');
      }

      // Générer le nom du fichier avec l'ID de l'assureur
      const fileExt = file.name.split('.').pop();
      const fileName = `${insurerId}.${fileExt}`;

      // Uploader le fichier
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Écraser si existe déjà
        });

      if (error) {
        logger.error('Erreur upload logo:', error);
        throw new Error('Erreur lors de l\'upload du logo');
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      // Mettre à jour l'URL dans la table insurers
      const { error: updateError } = await supabase
        .from('insurers')
        .update({ logo_url: publicUrl })
        .eq('id', insurerId);

      if (updateError) {
        logger.error('Erreur mise à jour logo_url:', updateError);
        throw new Error('Erreur lors de la mise à jour de l\'URL du logo');
      }

      logger.info(`Logo uploadé pour l'assureur ${insurerId}: ${publicUrl}`);

      return {
        path: data.path,
        url: publicUrl
      };
    } catch (error) {
      logger.error('Erreur upload logo:', error);
      throw error;
    }
  }

  /**
   * Supprime le logo d'un assureur
   */
  async deleteLogo(insurerId: string): Promise<void> {
    try {
      // Récupérer l'URL actuelle pour trouver le fichier
      const { data: insurer } = await supabase
        .from('insurers')
        .select('logo_url')
        .eq('id', insurerId)
        .single();

      if (insurer?.logo_url) {
        // Extraire le nom du fichier de l'URL
        const fileName = insurer.logo_url.split('/').pop();

        if (fileName) {
          // Supprimer le fichier du storage
          const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fileName]);

          if (error) {
            logger.error('Erreur suppression logo:', error);
            throw new Error('Erreur lors de la suppression du logo');
          }
        }
      }

      // Mettre à jour la table insurers
      const { error: updateError } = await supabase
        .from('insurers')
        .update({ logo_url: null })
        .eq('id', insurerId);

      if (updateError) {
        logger.error('Erreur mise à jour logo_url:', updateError);
        throw new Error('Erreur lors de la mise à jour de l\'URL du logo');
      }

      logger.info(`Logo supprimé pour l'assureur ${insurerId}`);
    } catch (error) {
      logger.error('Erreur suppression logo:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL publique du logo d'un assureur
   */
  getLogoUrl(insurerId: string, logoUrlFromDb?: string | null): string {
    if (logoUrlFromDb) {
      return logoUrlFromDb;
    }

    // Retourner l'URL par défaut (sera générée côté client si pas de logo)
    return `/storage/v1/object/public/${BUCKET_NAME}/${insurerId}.png`;
  }

  /**
   * Vérifie si un logo existe pour un assureur
   */
  async logoExists(insurerId: string): Promise<boolean> {
    try {
      // Vérifier d'abord dans la base de données
      const { data: insurer } = await supabase
        .from('insurers')
        .select('logo_url')
        .eq('id', insurerId)
        .single();

      if (insurer?.logo_url) {
        return true;
      }

      // Vérifier dans le storage
      const { data: files } = await supabase.storage
        .from(BUCKET_NAME)
        .list(`${insurerId}.`, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      return files && files.length > 0;
    } catch (error) {
      logger.error('Erreur vérification logo:', error);
      return false;
    }
  }
}

export const insurerLogoService = new InsurerLogoService();
