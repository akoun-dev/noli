/**
 * Hook pour le contexte de sécurité
 * Fournit des fonctionnalités de sécurité avancées pour l'authentification
 */

import { useState, useEffect, useCallback } from 'react'
import { securityManager } from '@/lib/security-manager'
import { anomalyDetector, type AnomalyAlert } from '@/lib/anomaly-detector'

export interface SecurityContext {
  deviceFingerprint: any
  ipInfo: {
    ip?: string
    country?: string
    city?: string
  }
  riskLevel: any
  captchaRequired: boolean
  recentAlerts: AnomalyAlert[]
  isLoading: boolean
}

export const useSecurityContext = () => {
  const [securityContext, setSecurityContext] = useState<SecurityContext>({
    deviceFingerprint: null,
    ipInfo: {},
    riskLevel: null,
    captchaRequired: false,
    recentAlerts: [],
    isLoading: true
  })

  // Générer l'empreinte device au chargement
  useEffect(() => {
    const generateDeviceFingerprint = async () => {
      try {
        const fingerprint = anomalyDetector.generateDeviceFingerprint()

        setSecurityContext(prev => ({
          ...prev,
          deviceFingerprint: fingerprint,
          isLoading: false
        }))
      } catch (error) {
        console.error('Error generating device fingerprint:', error)
        setSecurityContext(prev => ({
          ...prev,
          isLoading: false
        }))
      }
    }

    generateDeviceFingerprint()
  }, [])

  // Récupérer les informations IP
  const fetchIPInfo = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()

      setSecurityContext(prev => ({
        ...prev,
        ipInfo: {
          ip: data.ip,
          country: data.country_name,
          city: data.city
        }
      }))
    } catch (error) {
      console.warn('Could not fetch IP info:', error)
    }
  }, [])

  // Charger les infos IP au montage
  useEffect(() => {
    fetchIPInfo()
  }, [fetchIPInfo])

  // Évaluer le niveau de risque pour un email
  const assessRisk = useCallback(async (email: string) => {
    try {
      const risk = await securityManager.assessRisk(email, {
        ip: securityContext.ipInfo.ip,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })

      const captchaRequired = securityManager.shouldRequireCaptcha(risk)

      setSecurityContext(prev => ({
        ...prev,
        riskLevel: risk,
        captchaRequired
      }))

      return { risk, captchaRequired }
    } catch (error) {
      console.error('Error assessing risk:', error)
      return { risk: null, captchaRequired: false }
    }
  }, [securityContext.ipInfo.ip])

  // Gérer les alertes de sécurité
  const addSecurityAlert = useCallback((alert: AnomalyAlert) => {
    setSecurityContext(prev => ({
      ...prev,
      recentAlerts: [alert, ...prev.recentAlerts.slice(0, 9)] // Garder les 10 plus récentes
    }))
  }, [])

  // Nettoyer les anciennes alertes
  const clearOldAlerts = useCallback(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)

    setSecurityContext(prev => ({
      ...prev,
      recentAlerts: prev.recentAlerts.filter(alert => alert.timestamp > oneHourAgo)
    }))
  }, [])

  // Nettoyer périodiquement les anciennes alertes
  useEffect(() => {
    const interval = setInterval(clearOldAlerts, 5 * 60 * 1000) // Toutes les 5 minutes
    return () => clearInterval(interval)
  }, [clearOldAlerts])

  return {
    securityContext,
    assessRisk,
    addSecurityAlert,
    clearOldAlerts
  }
}