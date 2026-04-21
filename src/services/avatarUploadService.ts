import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const AVATAR_BUCKET = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface UploadResult {
  url: string;
  path: string;
}

export const avatarUploadService = {
  /**
   * Upload avatar to Supabase Storage
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    try {
      // Validation
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('L\'image ne doit pas dépasser 5MB.');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // If bucket doesn't exist, try to create it
        if (error.message.includes('The resource was not found')) {
          logger.info('Avatar bucket not found, creating...');
          // Note: Bucket creation requires admin privileges
          throw new Error('Le système de stockage n\'est pas disponible. Veuillez contacter le support.');
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        logger.warn('Failed to update profile avatar_url:', updateError);
      }

      return {
        url: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      throw error;
    }
  },

  /**
   * Delete avatar from Supabase Storage
   */
  async deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf(AVATAR_BUCKET) + 1).join('/');

      // Delete from storage
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      // Update profile to remove avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);
    } catch (error) {
      logger.error('Error deleting avatar:', error);
      throw error;
    }
  },

  /**
   * Get avatar URL
   */
  getAvatarUrl(userId: string, fileName: string): string {
    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(`${userId}/${fileName}`);

    return data.publicUrl;
  },

  /**
   * Validate avatar file
   */
  validateAvatar(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Type de fichier non supporté. Utilisez JPG, PNG ou WebP.'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'L\'image ne doit pas dépasser 5MB.'
      };
    }

    return { valid: true };
  }
};

export default avatarUploadService;
