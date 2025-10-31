/**
 * Système de tracking des événements utilisateur et analytics
 * Supporte multiple providers (Mixpanel, Amplitude, Google Analytics, etc.)
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  role?: 'USER' | 'INSURER' | 'ADMIN';
  company?: string;
  phone?: string;
  registrationDate?: string;
  lastLogin?: string;
  [key: string]: any;
}

export interface FunnelStep {
  stepName: string;
  stepNumber: number;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface AnalyticsProvider {
  name: string;
  init: () => void;
  track: (event: AnalyticsEvent) => void;
  identify: (user: UserProperties) => void;
  page: (page: string, properties?: Record<string, any>) => void;
  alias?: (alias: string, original?: string) => void;
  group?: (groupId: string, traits?: Record<string, any>) => void;
  reset?: () => void;
}

class AnalyticsManager {
  private static instance: AnalyticsManager;
  private providers: AnalyticsProvider[] = [];
  private userId: string | null = null;
  private userProperties: UserProperties | null = null;
  private isInitialized = false;
  private isEnabled = import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  private constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Mixpanel
    if (import.meta.env.VITE_MIXPANEL_TOKEN) {
      const mixpanelProvider: AnalyticsProvider = {
        name: 'mixpanel',
        init: () => {
          if (typeof window !== 'undefined' && window.mixpanel) {
            window.mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
              track_pageview: true,
              persistence: 'localStorage',
            });
          }
        },
        track: (event) => {
          if (typeof window !== 'undefined' && window.mixpanel) {
            window.mixpanel.track(event.event, event.properties);
          }
        },
        identify: (user) => {
          if (typeof window !== 'undefined' && window.mixpanel) {
            window.mixpanel.identify(user.userId, user);
          }
        },
        page: (page, properties) => {
          if (typeof window !== 'undefined' && window.mixpanel) {
            window.mixpanel.track('Page View', { page, ...properties });
          }
        },
        alias: (alias, original) => {
          if (typeof window !== 'undefined' && window.mixpanel) {
            window.mixpanel.alias(alias, original);
          }
        },
        reset: () => {
          if (typeof window !== 'undefined' && window.mixpanel) {
            window.mixpanel.reset();
          }
        },
      };
      this.providers.push(mixpanelProvider);
    }

    // Amplitude
    if (import.meta.env.VITE_AMPLITUDE_API_KEY) {
      const amplitudeProvider: AnalyticsProvider = {
        name: 'amplitude',
        init: () => {
          if (typeof window !== 'undefined' && window.amplitude) {
            window.amplitude.getInstance().init(import.meta.env.VITE_AMPLITUDE_API_KEY);
          }
        },
        track: (event) => {
          if (typeof window !== 'undefined' && window.amplitude) {
            window.amplitude.getInstance().logEvent(event.event, event.properties);
          }
        },
        identify: (user) => {
          if (typeof window !== 'undefined' && window.amplitude) {
            window.amplitude.getInstance().setUserId(user.userId);
            window.amplitude.getInstance().setUserProperties(user);
          }
        },
        page: (page, properties) => {
          if (typeof window !== 'undefined' && window.amplitude) {
            window.amplitude.getInstance().logEvent('Page View', { page, ...properties });
          }
        },
        reset: () => {
          if (typeof window !== 'undefined' && window.amplitude) {
            window.amplitude.getInstance().setUserId(null);
          }
        },
      };
      this.providers.push(amplitudeProvider);
    }

    // Google Analytics 4
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      const gaProvider: AnalyticsProvider = {
        name: 'google-analytics',
        init: () => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
              send_page_view: false,
            });
          }
        },
        track: (event) => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', event.event, event.properties);
          }
        },
        identify: (user) => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
              user_id: user.userId,
            });
          }
        },
        page: (page, properties) => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
              page_title: page,
              page_location: window.location.href,
            });
          }
        },
      };
      this.providers.push(gaProvider);
    }

    // Provider local pour développement
    const localProvider: AnalyticsProvider = {
      name: 'local',
      init: () => {
        // Stocker les événements localement pour le debugging
        if (typeof window !== 'undefined') {
          window.analyticsEvents = [];
        }
      },
      track: (event) => {
        if (typeof window !== 'undefined') {
          window.analyticsEvents = window.analyticsEvents || [];
          window.analyticsEvents.push({
            ...event,
            timestamp: Date.now(),
          });
          console.log('Analytics Event:', event);
        }
      },
      identify: (user) => {
        console.log('Analytics Identify:', user);
      },
      page: (page, properties) => {
        console.log('Analytics Page:', page, properties);
      },
      reset: () => {
        if (typeof window !== 'undefined') {
          window.analyticsEvents = [];
        }
      },
    };
    this.providers.push(localProvider);
  }

  public init(): void {
    if (!this.isEnabled) return;

    try {
      this.providers.forEach(provider => {
        try {
          provider.init();
        } catch (error) {
          console.error(`Failed to initialize ${provider.name}:`, error);
        }
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }

  public track(event: string, properties?: Record<string, any>): void {
    if (!this.isEnabled || !this.isInitialized) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        userId: this.userId,
      },
    };

    this.providers.forEach(provider => {
      try {
        provider.track(analyticsEvent);
      } catch (error) {
        console.error(`Failed to track event with ${provider.name}:`, error);
      }
    });
  }

  public identify(user: UserProperties): void {
    if (!this.isEnabled || !this.isInitialized) return;

    this.userId = user.userId;
    this.userProperties = user;

    this.providers.forEach(provider => {
      try {
        provider.identify(user);
      } catch (error) {
        console.error(`Failed to identify user with ${provider.name}:`, error);
      }
    });
  }

  public page(page: string, properties?: Record<string, any>): void {
    if (!this.isEnabled || !this.isInitialized) return;

    this.providers.forEach(provider => {
      try {
        provider.page(page, properties);
      } catch (error) {
        console.error(`Failed to track page with ${provider.name}:`, error);
      }
    });
  }

  public alias(alias: string, original?: string): void {
    if (!this.isEnabled || !this.isInitialized) return;

    this.providers.forEach(provider => {
      if (provider.alias) {
        try {
          provider.alias(alias, original);
        } catch (error) {
          console.error(`Failed to alias user with ${provider.name}:`, error);
        }
      }
    });
  }

  public group(groupId: string, traits?: Record<string, any>): void {
    if (!this.isEnabled || !this.isInitialized) return;

    this.providers.forEach(provider => {
      if (provider.group) {
        try {
          provider.group(groupId, traits);
        } catch (error) {
          console.error(`Failed to group user with ${provider.name}:`, error);
        }
      }
    });
  }

  public reset(): void {
    if (!this.isEnabled || !this.isInitialized) return;

    this.userId = null;
    this.userProperties = null;

    this.providers.forEach(provider => {
      try {
        if (provider.reset) {
          provider.reset();
        }
      } catch (error) {
        console.error(`Failed to reset ${provider.name}:`, error);
      }
    });
  }

  // Méthodes spécifiques pour les funnels
  public trackFunnelStep(stepName: string, stepNumber: number, properties?: Record<string, any>): void {
    this.track('Funnel Step', {
      stepName,
      stepNumber,
      funnel: 'Insurance Comparison',
      ...properties,
    });
  }

  // Méthodes spécifiques pour l'assurance
  public trackQuoteGeneration(properties?: Record<string, any>): void {
    this.track('Quote Generated', {
      category: 'Insurance',
      ...properties,
    });
  }

  public trackQuoteCompletion(properties?: Record<string, any>): void {
    this.track('Quote Completed', {
      category: 'Insurance',
      ...properties,
    });
  }

  public trackPolicyPurchase(properties?: Record<string, any>): void {
    this.track('Policy Purchased', {
      category: 'Insurance',
      revenue: properties?.premium,
      ...properties,
    });
  }

  public trackComparisonStart(properties?: Record<string, any>): void {
    this.trackFunnelStep('Comparison Started', 1, properties);
  }

  public trackVehicleInfo(properties?: Record<string, any>): void {
    this.trackFunnelStep('Vehicle Info Completed', 2, properties);
  }

  public trackPersonalInfo(properties?: Record<string, any>): void {
    this.trackFunnelStep('Personal Info Completed', 3, properties);
  }

  public trackInsuranceNeeds(properties?: Record<string, any>): void {
    this.trackFunnelStep('Insurance Needs Completed', 4, properties);
  }

  public trackComparisonResults(properties?: Record<string, any>): void {
    this.trackFunnelStep('Comparison Results Viewed', 5, properties);
  }

  // Méthodes pour les interactions UI
  public trackButtonClick(buttonName: string, properties?: Record<string, any>): void {
    this.track('Button Click', {
      buttonName,
      ...properties,
    });
  }

  public trackFormSubmit(formName: string, properties?: Record<string, any>): void {
    this.track('Form Submitted', {
      formName,
      ...properties,
    });
  }

  public trackModalView(modalName: string, properties?: Record<string, any>): void {
    this.track('Modal Viewed', {
      modalName,
      ...properties,
    });
  }

  public trackDownload(fileName: string, properties?: Record<string, any>): void {
    this.track('File Downloaded', {
      fileName,
      ...properties,
    });
  }

  // Méthodes pour les erreurs
  public trackError(error: Error, context?: Record<string, any>): void {
    this.track('Error Occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    });
  }

  // Méthodes pour les performances
  public trackPageLoad(page: string, loadTime: number): void {
    this.track('Page Load', {
      page,
      loadTime,
      type: 'Performance',
    });
  }

  public trackApiCall(method: string, url: string, status: number, duration: number): void {
    this.track('API Call', {
      method,
      url,
      status,
      duration,
      type: 'Performance',
    });
  }
}

// Extensions TypeScript pour window
declare global {
  interface Window {
    mixpanel?: {
      init: (token: string, config?: any) => void;
      track: (event: string, properties?: any) => void;
      identify: (userId: string, traits?: any) => void;
      alias: (alias: string, original?: string) => void;
      reset: () => void;
    };
    amplitude?: {
      getInstance: () => {
        init: (apiKey: string) => void;
        logEvent: (eventType: string, eventProperties?: any) => void;
        setUserId: (userId: string) => void;
        setUserProperties: (properties: any) => void;
      };
    };
    gtag?: (command: string, ...args: any[]) => void;
    analyticsEvents?: Array<{
      event: string;
      properties?: any;
      timestamp: number;
    }>;
    supabase?: any;
  }
}

// Export du singleton
export const analytics = AnalyticsManager.getInstance();

// Export des types et classes
export { AnalyticsManager };
export type { AnalyticsEvent, UserProperties, FunnelStep, AnalyticsProvider };