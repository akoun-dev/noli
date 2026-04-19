/**
 * Système de détection d'anomalies pour l'authentification
 * Détecte les comportements suspects selon auth-agent.md
 */

import { logger } from '@/lib/logger'

export interface DeviceFingerprint {
  userAgent: string
  language: string
  timezone: string
  screenResolution: string
  colorDepth: number
  platform: string
  hardwareConcurrency: number
  deviceMemory?: number
  cookiesEnabled: boolean
  doNotTrack: string
  canvas?: string
  webgl?: string
}

export interface AnomalyAlert {
  id: string
  userId: string
  email: string
  type: 'new_device' | 'new_location' | 'impossible_travel' | 'brute_force' | 'automated_attack' | 'suspicious_timing'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  details: any
  ip?: string
  userAgent?: string
}

export interface GeoLocation {
  country: string
  city: string
  latitude: number
  longitude: number
  timezone: string
  accuracy: number
}

export interface LoginAttempt {
  id: string
  userId: string
  email: string
  timestamp: number
  ip: string
  userAgent: string
  success: boolean
  geoLocation?: GeoLocation
  deviceFingerprint: DeviceFingerprint
}

class AnomalyDetector {
  private static instance: AnomalyDetector
  private knownDevices = new Map<string, Set<string>>() // userId -> device fingerprints
  private knownLocations = new Map<string, Set<string>>() // userId -> location hashes
  private recentAttempts = new Map<string, LoginAttempt[]>() // userId -> attempts
  private alerts: AnomalyAlert[] = []

  static getInstance(): AnomalyDetector {
    if (!AnomalyDetector.instance) {
      AnomalyDetector.instance = new AnomalyDetector()
    }
    return AnomalyDetector.instance
  }

  /**
   * Génère une empreinte device unique
   */
  generateDeviceFingerprint(): DeviceFingerprint {
    const canvas = this.getCanvasFingerprint()
    const webgl = this.getWebGLFingerprint()

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown',
      canvas,
      webgl
    }
  }

  /**
   * Génère un hash de l'empreinte device
   */
  private hashDeviceFingerprint(fingerprint: DeviceFingerprint): string {
    const str = JSON.stringify(fingerprint)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Génère un hash de localisation
   */
  private hashLocation(geoLocation: GeoLocation): string {
    // Arrondir les coordonnées pour créer des "zones" plutôt que des points exacts
    const lat = Math.round(geoLocation.latitude * 10) / 10
    const lon = Math.round(geoLocation.longitude * 10) / 10
    return `${geoLocation.country}-${geoLocation.city}-${lat}-${lon}`
  }

  /**
   * Analyse une tentative de connexion pour détecter des anomalies
   */
  async analyzeLoginAttempt(attempt: Omit<LoginAttempt, 'id'>): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = []

    logger.security(`Analyzing login attempt for ${attempt.email} from ${attempt.ip}`)

    // 1. Détecter un nouvel appareil
    const deviceAlert = this.detectNewDevice(attempt)
    if (deviceAlert) alerts.push(deviceAlert)

    // 2. Détecter une nouvelle localisation
    const locationAlert = this.detectNewLocation(attempt)
    if (locationAlert) alerts.push(locationAlert)

    // 3. Détecter un voyage impossible (géolocalisation)
    const travelAlert = await this.detectImpossibleTravel(attempt)
    if (travelAlert) alerts.push(travelAlert)

    // 4. Détecter une attaque automatisée
    const automatedAlert = this.detectAutomatedAttack(attempt)
    if (automatedAlert) alerts.push(automatedAlert)

    // 5. Détecter un timing suspect
    const timingAlert = this.detectSuspiciousTiming(attempt)
    if (timingAlert) alerts.push(timingAlert)

    // 6. Stocker la tentative pour analyses futures
    this.storeLoginAttempt(attempt)

    // 7. Logger les alertes
    if (alerts.length > 0) {
      for (const alert of alerts) {
        logger.security(`Anomaly detected: ${alert.type} for ${attempt.email}`, alert)
        this.alerts.push(alert)
      }
    }

    return alerts
  }

  /**
   * Détecte si l'appareil est nouveau pour cet utilisateur
   */
  private detectNewDevice(attempt: Omit<LoginAttempt, 'id'>): AnomalyAlert | null {
    const deviceHash = this.hashDeviceFingerprint(attempt.deviceFingerprint)
    const knownDevices = this.knownDevices.get(attempt.userId) || new Set()

    if (!knownDevices.has(deviceHash)) {
      // Premier appareil - pas d'alerte
      if (knownDevices.size === 0) {
        knownDevices.add(deviceHash)
        this.knownDevices.set(attempt.userId, knownDevices)
        return null
      }

      // Nouvel appareil détecté
      knownDevices.add(deviceHash)
      this.knownDevices.set(attempt.userId, knownDevices)

      return {
        id: this.generateAlertId(),
        userId: attempt.userId,
        email: attempt.email,
        type: 'new_device',
        severity: 'medium',
        timestamp: Date.now(),
        details: {
          deviceFingerprint: attempt.deviceFingerprint,
          knownDevicesCount: knownDevices.size
        },
        ip: attempt.ip,
        userAgent: attempt.userAgent
      }
    }

    return null
  }

  /**
   * Détecte si la localisation est nouvelle pour cet utilisateur
   */
  private detectNewLocation(attempt: Omit<LoginAttempt, 'id'>): AnomalyAlert | null {
    if (!attempt.geoLocation) return null

    const locationHash = this.hashLocation(attempt.geoLocation)
    const knownLocations = this.knownLocations.get(attempt.userId) || new Set()

    if (!knownLocations.has(locationHash)) {
      // Première localisation - pas d'alerte
      if (knownLocations.size === 0) {
        knownLocations.add(locationHash)
        this.knownLocations.set(attempt.userId, knownLocations)
        return null
      }

      // Nouvelle localisation détectée
      knownLocations.add(locationHash)
      this.knownLocations.set(attempt.userId, knownLocations)

      return {
        id: this.generateAlertId(),
        userId: attempt.userId,
        email: attempt.email,
        type: 'new_location',
        severity: 'medium',
        timestamp: Date.now(),
        details: {
          location: attempt.geoLocation,
          knownLocationsCount: knownLocations.size
        },
        ip: attempt.ip,
        userAgent: attempt.userAgent
      }
    }

    return null
  }

  /**
   * Détecte des voyages impossibles (vitesse trop élevée entre localisations)
   */
  private async detectImpossibleTravel(attempt: Omit<LoginAttempt, 'id'>): Promise<AnomalyAlert | null> {
    if (!attempt.geoLocation) return null

    const userAttempts = this.recentAttempts.get(attempt.userId) || []
    const recentSuccessful = userAttempts
      .filter(a => a.success && a.geoLocation)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    if (recentSuccessful.length === 0) return null

    const lastAttempt = recentSuccessful[0]
    const timeDiff = (attempt.timestamp - lastAttempt.timestamp) / (1000 * 60 * 60) // heures

    if (timeDiff > 24) return null // Trop longtemps entre les tentatives

    const distance = this.calculateDistance(
      lastAttempt.geoLocation!.latitude,
      lastAttempt.geoLocation!.longitude,
      attempt.geoLocation.latitude,
      attempt.geoLocation.longitude
    )

    const speed = distance / Math.max(timeDiff, 1) // km/h

    // Vitesse commerciale maximum ~1000 km/h
    if (speed > 1000) {
      return {
        id: this.generateAlertId(),
        userId: attempt.userId,
        email: attempt.email,
        type: 'impossible_travel',
        severity: 'high',
        timestamp: Date.now(),
        details: {
          distance,
          timeDiff,
          speed,
          fromLocation: lastAttempt.geoLocation,
          toLocation: attempt.geoLocation
        },
        ip: attempt.ip,
        userAgent: attempt.userAgent
      }
    }

    return null
  }

  /**
   * Détecte des patterns d'attaque automatisée
   */
  private detectAutomatedAttack(attempt: Omit<LoginAttempt, 'id'>): AnomalyAlert | null {
    const userAttempts = this.recentAttempts.get(attempt.userId) || []
    const recentAttempts = userAttempts.filter(a =>
      attempt.timestamp - a.timestamp < 60 * 60 * 1000 // dernière heure
    )

    // Trop de tentatives en peu de temps
    if (recentAttempts.length > 20) {
      return {
        id: this.generateAlertId(),
        userId: attempt.userId,
        email: attempt.email,
        type: 'automated_attack',
        severity: 'high',
        timestamp: Date.now(),
        details: {
          attemptsInHour: recentAttempts.length,
          timeWindow: '1 hour'
        },
        ip: attempt.ip,
        userAgent: attempt.userAgent
      }
    }

    // Vérifier si les user agents changent constamment (bot)
    const uniqueUserAgents = new Set(recentAttempts.map(a => a.userAgent))
    if (recentAttempts.length > 5 && uniqueUserAgents.size >= recentAttempts.length * 0.8) {
      return {
        id: this.generateAlertId(),
        userId: attempt.userId,
        email: attempt.email,
        type: 'automated_attack',
        severity: 'medium',
        timestamp: Date.now(),
        details: {
          reason: 'multiple_user_agents',
          uniqueUserAgents: uniqueUserAgents.size,
          totalAttempts: recentAttempts.length
        },
        ip: attempt.ip,
        userAgent: attempt.userAgent
      }
    }

    return null
  }

  /**
   * Détecte des heures de connexion suspectes
   */
  private detectSuspiciousTiming(attempt: Omit<LoginAttempt, 'id'>): AnomalyAlert | null {
    const userAttempts = this.recentAttempts.get(attempt.userId) || []
    const successfulAttempts = userAttempts.filter(a => a.success)

    if (successfulAttempts.length < 5) return null // Pas assez d'historique

    const hour = new Date(attempt.timestamp).getHours()
    const userHours = successfulAttempts.map(a => new Date(a.timestamp).getHours())

    // Heures habituelles de connexion de l'utilisateur
    const usualHours = this.calculateUserUsualHours(userHours)

    // Si l'heure n'est pas dans les habitudes et que c'est la nuit
    if (hour >= 2 && hour <= 5 && !usualHours.includes(hour)) {
      return {
        id: this.generateAlertId(),
        userId: attempt.userId,
        email: attempt.email,
        type: 'suspicious_timing',
        severity: 'low',
        timestamp: Date.now(),
        details: {
          unusualHour: hour,
          usualHours,
          timeCategory: 'night'
        },
        ip: attempt.ip,
        userAgent: attempt.userAgent
      }
    }

    return null
  }

  /**
   * Calcule les heures habituelles de connexion d'un utilisateur
   */
  private calculateUserUsualHours(hours: number[]): number[] {
    const hourCounts = new Map<number, number>()

    hours.forEach(hour => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    })

    // Retourner les heures qui représentent plus de 10% des connexions
    const total = hours.length
    const threshold = total * 0.1

    return Array.from(hourCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([hour, _]) => hour)
  }

  /**
   * Calcule la distance entre deux coordonnées géographiques
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Génère un identifiant unique pour les alertes
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Stocke une tentative de connexion pour analyses futures
   */
  private storeLoginAttempt(attempt: Omit<LoginAttempt, 'id'>): void {
    const fullAttempt: LoginAttempt = {
      ...attempt,
      id: this.generateAlertId()
    }

    const userAttempts = this.recentAttempts.get(attempt.userId) || []
    userAttempts.push(fullAttempt)

    // Garder seulement les 100 dernières tentatives par utilisateur
    if (userAttempts.length > 100) {
      userAttempts.splice(0, userAttempts.length - 100)
    }

    this.recentAttempts.set(attempt.userId, userAttempts)
  }

  /**
   * Génère une empreinte canvas
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'no-canvas'

      canvas.width = 200
      canvas.height = 50

      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('NOLI Security 🛡️', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('NOLI Security 🛡️', 4, 17)

      return canvas.toDataURL()
    } catch (error) {
      return 'canvas-error'
    }
  }

  /**
   * Génère une empreinte WebGL
   */
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl')
      if (!gl) return 'no-webgl'

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (!debugInfo) return 'no-webgl-debug'

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)

      return `${vendor}|${renderer}`
    } catch (error) {
      return 'webgl-error'
    }
  }

  /**
   * Récupère les alertes récentes pour un utilisateur
   */
  getRecentAlerts(userId: string, limit: number = 50): AnomalyAlert[] {
    return this.alerts
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Récupère toutes les alertes de haut niveau
   */
  getHighSeverityAlerts(limit: number = 100): AnomalyAlert[] {
    return this.alerts
      .filter(alert => alert.severity === 'high' || alert.severity === 'critical')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Nettoie les anciennes données
   */
  cleanup(olderThanDays: number = 30): void {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)

    // Nettoyer les alertes
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime)

    // Nettoyer les tentatives
    for (const [userId, attempts] of this.recentAttempts.entries()) {
      const recent = attempts.filter(attempt => attempt.timestamp > cutoffTime)
      if (recent.length === 0) {
        this.recentAttempts.delete(userId)
      } else {
        this.recentAttempts.set(userId, recent)
      }
    }
  }

  /**
   * Récupère des statistiques sur les anomalies
   */
  getAnomalyStats(): {
    totalAlerts: number
    alertsByType: Record<string, number>
    alertsBySeverity: Record<string, number>
    topRiskUsers: Array<{ userId: string; email: string; alertCount: number }>
  } {
    const alertsByType: Record<string, number> = {}
    const alertsBySeverity: Record<string, number> = {}
    const userAlertCounts = new Map<string, { email: string; count: number }>()

    this.alerts.forEach(alert => {
      // Par type
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1

      // Par sévérité
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1

      // Par utilisateur
      const existing = userAlertCounts.get(alert.userId)
      if (existing) {
        existing.count++
      } else {
        userAlertCounts.set(alert.userId, { email: alert.email, count: 1 })
      }
    })

    const topRiskUsers = Array.from(userAlertCounts.entries())
      .map(([userId, data]) => ({ userId, email: data.email, alertCount: data.count }))
      .sort((a, b) => b.alertCount - a.alertCount)
      .slice(0, 10)

    return {
      totalAlerts: this.alerts.length,
      alertsByType,
      alertsBySeverity,
      topRiskUsers
    }
  }
}

export const anomalyDetector = AnomalyDetector.getInstance()