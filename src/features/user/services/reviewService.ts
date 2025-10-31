import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface Review {
  id: string
  userId: string
  insurerId: string
  insurerName: string
  insurerLogo?: string
  rating: number
  title: string
  content: string
  pros?: string
  cons?: string
  responseText?: string
  respondedAt?: string
  status: ReviewStatus
  helpfulCount: number
  reportCount: number
  isVerified: boolean
  createdAt: string
  updatedAt: string
  quoteId?: string
  policyId?: string
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden'

export interface ReviewInput {
  insurerId: string
  rating: number
  title: string
  content: string
  pros?: string
  cons?: string
  quoteId?: string
  policyId?: string
}

export interface ReviewStats {
  total: number
  approved: number
  pending: number
  averageRating: number
  helpfulVotes: number
}

class ReviewService {
  private readonly tableName = 'reviews' // Note: This table doesn't exist yet in the schema

  /**
   * Get all reviews for a user
   * Note: For now, generates mock reviews based on user policies
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      // Since reviews table doesn't exist yet, generate mock reviews based on policies
      const { data: policies, error } = await supabase
        .from('policies')
        .select(
          `
          *,
          insurers (
            id,
            name,
            logo_url
          )
        `
        )
        .eq('user_id', userId)

      if (error) throw error

      // Generate mock reviews based on policies
      const mockReviews: Review[] =
        policies?.map((policy, index) => ({
          id: `review-${policy.id}`,
          userId,
          insurerId: policy.insurer_id,
          insurerName: policy.insurers?.name || 'Assureur inconnu',
          insurerLogo: policy.insurers?.logo_url,
          rating: this.generateRandomRating(),
          title: this.generateReviewTitle(index),
          content: this.generateReviewContent(index),
          pros: this.generateReviewPros(index),
          cons: this.generateReviewCons(index),
          responseText: index % 2 === 0 ? this.generateResponse() : undefined,
          respondedAt: index % 2 === 0 ? new Date().toISOString() : undefined,
          status: index % 2 === 0 ? 'approved' : 'pending',
          helpfulCount: index % 2 === 0 ? 12 : 3,
          reportCount: 0,
          isVerified: index % 2 === 0,
          createdAt: policy.created_at,
          updatedAt: policy.updated_at,
          quoteId: policy.quote_id,
          policyId: policy.id,
        })) || []

      return mockReviews
    } catch (err) {
      logger.error('Error fetching user reviews:', err)
      throw err
    }
  }

  /**
   * Create a new review
   * Note: For now, simulates creation
   */
  async createReview(userId: string, reviewData: ReviewInput): Promise<Review> {
    try {
      // Get insurer details
      const { data: insurer, error: insurerError } = await supabase
        .from('insurers')
        .select('name, logo_url')
        .eq('id', reviewData.insurerId)
        .single()

      if (insurerError && insurerError.code !== 'PGRST116') {
        throw insurerError
      }

      // Simulate review creation (since table doesn't exist)
      const newReview: Review = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        insurerId: reviewData.insurerId,
        insurerName: insurer?.name || 'Assureur inconnu',
        insurerLogo: insurer?.logo_url,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        pros: reviewData.pros,
        cons: reviewData.cons,
        status: 'pending',
        helpfulCount: 0,
        reportCount: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quoteId: reviewData.quoteId,
        policyId: reviewData.policyId,
      }

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      logger.info('Review created (simulated)', { reviewId: newReview.id })
      return newReview
    } catch (err) {
      logger.error('Error creating review:', err)
      throw err
    }
  }

  /**
   * Update an existing review
   * Note: For now, simulates update
   */
  async updateReview(reviewId: string, updateData: Partial<ReviewInput>): Promise<Review> {
    try {
      // Simulate update (since table doesn't exist)
      const updatedReview: Review = {
        id: reviewId,
        userId: 'user_id', // Would get from original review
        insurerId: updateData.insurerId || 'insurer_id',
        insurerName: 'Assureur',
        rating: updateData.rating || 5,
        title: updateData.title || 'Review title',
        content: updateData.content || 'Review content',
        pros: updateData.pros,
        cons: updateData.cons,
        status: 'pending',
        helpfulCount: 0,
        reportCount: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      logger.info('Review updated (simulated)', { reviewId })
      return updatedReview
    } catch (err) {
      logger.error('Error updating review:', err)
      throw err
    }
  }

  /**
   * Delete a review
   * Note: For now, simulates deletion
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      // Simulate deletion (since table doesn't exist)
      await new Promise((resolve) => setTimeout(resolve, 500))

      logger.info('Review deleted (simulated)', { reviewId })
    } catch (err) {
      logger.error('Error deleting review:', err)
      throw err
    }
  }

  /**
   * Get review statistics for a user
   */
  async getUserReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const reviews = await this.getUserReviews(userId)

      const stats: ReviewStats = {
        total: reviews.length,
        approved: reviews.filter((r) => r.status === 'approved').length,
        pending: reviews.filter((r) => r.status === 'pending').length,
        averageRating:
          reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        helpfulVotes: reviews.reduce((sum, r) => sum + r.helpfulCount, 0),
      }

      return stats
    } catch (err) {
      logger.error('Error fetching review stats:', err)
      throw err
    }
  }

  /**
   * Get available insurers for review
   */
  async getInsurersForReview(
    userId: string
  ): Promise<Array<{ id: string; name: string; logo_url?: string }>> {
    try {
      // Get insurers from user's policies and quotes
      const { data: policies } = await supabase
        .from('policies')
        .select(
          `
          insurers (
            id,
            name,
            logo_url
          )
        `
        )
        .eq('user_id', userId)
        .neq('insurer_id', null)

      const { data: quotes } = await supabase
        .from('quotes')
        .select(
          `
          insurer_id
        `
        )
        .eq('user_id', userId)
        .neq('insurer_id', null)

      const insurerIds = new Set<string>()
      const insurersMap = new Map<string, { id: string; name: string; logo_url?: string }>()

      // Add insurers from policies
      policies?.forEach((policy) => {
        if (policy.insurers?.id) {
          insurerIds.add(policy.insurers.id)
          insurersMap.set(policy.insurers.id, policy.insurers)
        }
      })

      // Add unique insurers from quotes
      quotes?.forEach((quote) => {
        if (quote.insurer_id && !insurerIds.has(quote.insurer_id)) {
          insurerIds.add(quote.insurer_id)
          // We'd need to fetch insurer details separately
        }
      })

      return Array.from(insurersMap.values())
    } catch (err) {
      logger.error('Error fetching insurers for review:', err)
      throw err
    }
  }

  /**
   * Mark a review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      // TODO: Implement when reviews table is created
      logger.info('Review marked as helpful (simulated)', { reviewId })
    } catch (err) {
      logger.error('Error marking review as helpful:', err)
      throw err
    }
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string): Promise<void> {
    try {
      // TODO: Implement when reviews table is created
      logger.info('Review reported (simulated)', { reviewId })
    } catch (err) {
      logger.error('Error reporting review:', err)
      throw err
    }
  }

  // Helper methods for generating mock data
  private generateRandomRating(): number {
    const ratings = [3, 4, 4, 5, 5, 5]
    return ratings[Math.floor(Math.random() * ratings.length)]
  }

  private generateReviewTitle(index: number): string {
    const titles = [
      'Excellent service client',
      'Service correct mais peut mieux faire',
      'Très satisfait de mon assurance',
      'Rapport qualité-prix intéressant',
      'Professionnalisme remarquable',
    ]
    return titles[index % titles.length]
  }

  private generateReviewContent(index: number): string {
    const contents = [
      "J'ai été très satisfait de la rapidité de traitement de mon dossier. L'équipe a été très professionnelle et disponible.",
      "L'assurance couvre bien les besoins de base mais j'ai trouvé quelques difficultés dans la communication.",
      'Service impeccable, tarifs compétitifs et processus simple. Je recommande vivement.',
      'Bonne couverture mais les délais de traitement pourraient être améliorés.',
    ]
    return contents[index % contents.length]
  }

  private generateReviewPros(index: number): string {
    const pros = [
      'Service client réactif, Tarifs compétitifs, Processus simple',
      'Bonne couverture de base, Prix raisonnable',
      'Professionnalisme, Rapidité, Disponibilité',
      'Tarifs attractifs, Couverture complète',
    ]
    return pros[index % pros.length]
  }

  private generateReviewCons(index: number): string {
    const cons = [
      'Délais de remboursement un peu longs',
      'Communication parfois difficile, Délais de réponse longs',
      'Documentation un peu complexe',
      'Manque de flexibilité dans certaines options',
    ]
    return cons[index % cons.length]
  }

  private generateResponse(): string {
    return 'Merci pour votre retour ! Nous sommes ravis de votre satisfaction et travaillons à améliorer nos services.'
  }
}

export const reviewService = new ReviewService()
export default reviewService
