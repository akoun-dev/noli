import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { validateUploadFile, buildSafeStorageKey } from '@/lib/file-upload'

export interface Document {
  id: string
  userId: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  mimeType: string
  fileUrl: string
  category: DocumentCategory
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  quoteId?: string
  policyId?: string
  insurerId?: string
}

export type DocumentCategory =
  | 'IDENTITY'
  | 'VEHICLE_REGISTRATION'
  | 'DRIVING_LICENSE'
  | 'INSURANCE_CARD'
  | 'INVOICE'
  | 'PHOTO'
  | 'CONTRACT'
  | 'PROOF_OF_ADDRESS'
  | 'MEDICAL_CERTIFICATE'
  | 'CLAIM_DOCUMENT'
  | 'OTHER'

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'

export interface DocumentUploadResult {
  id: string
  fileUrl: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  mimeType: string
}

class DocumentService {
  private readonly storageBucket = 'documents'

  /**
   * Upload a document to Supabase Storage
   */
  async uploadDocument(
    userId: string,
    file: File,
    _category: DocumentCategory,
    _metadata?: {
      quoteId?: string
      policyId?: string
      insurerId?: string
    }
  ): Promise<DocumentUploadResult> {
    try {
      // Validate content/type/size before writing to storage.
      const validation = await validateUploadFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error ?? 'Fichier invalide')
      }

      // Safe, random storage key — never derived from the raw file name.
      const storageKey = buildSafeStorageKey(userId, file.name)

      // Upload to Supabase Storage (private bucket)
      const { data, error } = await supabase.storage
        .from(this.storageBucket)
        .upload(storageKey, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        })

      if (error) throw error

      // Private bucket: return a short-lived signed URL, not a public one.
      const { data: signed } = await supabase.storage
        .from(this.storageBucket)
        .createSignedUrl(data.path, 60 * 60)

      logger.info('Document uploaded successfully', {
        userId,
        fileName: file.name,
        path: data.path,
        size: file.size,
      })

      return {
        id: data.path,
        fileUrl: signed?.signedUrl ?? '',
        fileName: data.path,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        mimeType: file.type,
      }
    } catch (err) {
      logger.error('Error uploading document:', err)
      throw err
    }
  }

  /**
   * Save document metadata to database
   * Note: This will work when the documents table is created
   */
  async saveDocumentMetadata(
    documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Document> {
    try {
      // TODO: Implement when documents table is created
      // For now, just return the document data with generated IDs
      const document: Document = {
        ...documentData,
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      logger.info('Document metadata saved', { documentId: document.id })
      return document
    } catch (err) {
      logger.error('Error saving document metadata:', err)
      throw err
    }
  }

  /**
   * Get all documents for a user
   * Note: For now, extracts documents from policy coverage_details
   */
  async getUserDocuments(userId: string): Promise<Document[]> {
    try {
      // Since documents table doesn't exist yet, extract from policy coverage_details
      const { data: policies, error } = await supabase
        .from('policies')
        .select(
          `
          id,
          policy_number,
          coverage_details,
          created_at,
          updated_at,
          insurers (
            id,
            name
          )
        `
        )
        .eq('user_id', userId)

      if (error) throw error

      const documents: Document[] = []

      policies?.forEach((policy) => {
        const docs = policy.coverage_details?.documents || []
        docs.forEach((doc: any, index: number) => {
          documents.push({
            id: `${policy.id}-${index}`,
            userId,
            fileName: doc.file_name || `document_${index}.pdf`,
            originalName: doc.original_name || doc.file_name || `Document ${index + 1}`,
            fileSize: doc.file_size || 0,
            fileType: doc.file_type || 'application/pdf',
            mimeType: doc.mime_type || 'application/pdf',
            fileUrl: doc.file_url || '#',
            category: doc.category || 'OTHER',
            status: doc.status || 'PENDING',
            createdAt: doc.created_at || policy.created_at,
            updatedAt: doc.updated_at || policy.updated_at,
            quoteId: policy.policy_number,
            policyId: policy.id,
            insurerId: policy.insurers?.id,
          })
        })
      })

      return documents
    } catch (err) {
      logger.error('Error fetching user documents:', err)
      throw err
    }
  }

  /**
   * Delete a document from storage and database
   */
  async deleteDocument(documentId: string, filePath: string): Promise<void> {
    try {
      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from(this.storageBucket)
        .remove([filePath])

      if (storageError) {
        logger.warn('Error deleting from storage:', storageError)
      }

      // TODO: Delete from database when documents table is created

      logger.info('Document deleted', { documentId, filePath })
    } catch (err) {
      logger.error('Error deleting document:', err)
      throw err
    }
  }

  /**
   * Get document statistics for a user
   */
  async getUserDocumentStats(userId: string): Promise<{
    total: number
    verified: number
    pending: number
    totalSize: number
    byCategory: Record<DocumentCategory, number>
  }> {
    try {
      const documents = await this.getUserDocuments(userId)

      const stats = {
        total: documents.length,
        verified: documents.filter((d) => d.status === 'VERIFIED').length,
        pending: documents.filter((d) => d.status === 'PENDING').length,
        totalSize: documents.reduce((sum, d) => sum + d.fileSize, 0),
        byCategory: documents.reduce(
          (acc, doc) => {
            acc[doc.category] = (acc[doc.category] || 0) + 1
            return acc
          },
          {} as Record<DocumentCategory, number>
        ),
      }

      return stats
    } catch (err) {
      logger.error('Error fetching document stats:', err)
      throw err
    }
  }

  /**
   * Download a document
   */
  async downloadDocument(fileUrl: string, fileName: string): Promise<void> {
    try {
      // Create download link
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      logger.info('Document download initiated', { fileName })
    } catch (err) {
      logger.error('Error downloading document:', err)
      throw err
    }
  }

  /**
   * Get public URL for a document
   */
  getDocumentUrl(filePath: string): string {
    const { data } = supabase.storage.from(this.storageBucket).getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Validate file type, size and content.
   * @deprecated Prefer `validateUploadFile` from `@/lib/file-upload` directly.
   * Kept as a thin async delegate so existing callers keep working with the
   * stronger (extension + MIME + magic-byte) validation.
   */
  async validateFile(file: File): Promise<{ isValid: boolean; error?: string }> {
    return validateUploadFile(file)
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(userId: string, category: DocumentCategory): Promise<Document[]> {
    try {
      const documents = await this.getUserDocuments(userId)
      return documents.filter((doc) => doc.category === category)
    } catch (err) {
      logger.error('Error fetching documents by category:', err)
      throw err
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(documentId: string, status: DocumentStatus): Promise<void> {
    try {
      // TODO: Implement when documents table is created
      logger.info('Document status updated', { documentId, status })
    } catch (err) {
      logger.error('Error updating document status:', err)
      throw err
    }
  }
}

export const documentService = new DocumentService()
export default documentService
