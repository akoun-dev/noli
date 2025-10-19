/**
 * Monitoring des performances et Web Vitals
 * Utilise les APIs natives du navigateur pour capturer les métriques
 */

import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

export interface WebVitals {
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
  INP: number; // Interaction to Next Paint
}

export interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming;
  resources: PerformanceResourceTiming[];
  paint: PerformancePaintTiming[];
  memory: PerformanceMemory;
  vitals: WebVitals;
}

interface PerformanceObserverEntry {
  name: string;
  value: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  private metrics: PerformanceMetrics | null = null;
  private isSupported = 'performance' in window && 'PerformanceObserver' in window;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    try {
      // Observer pour Web Vitals
      this.observeWebVitals();

      // Observer pour les ressources
      this.observeResources();

      // Observer pour les mesures de navigation
      this.observeNavigation();

      // Observer pour les interactions
      this.observeInteractions();

      logger.info('Performance monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error as Error);
    }
  }

  private observeWebVitals(): void {
    try {
      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.recordWebVital('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          this.recordWebVital('FID', (entry as PerformanceEventTiming).processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.recordWebVital('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // INP - Interaction to Next Paint
      const inpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const inpEntry = entry as PerformanceEventTiming;
          const inp = inpEntry.processingStart - inpEntry.startTime;
          this.recordWebVital('INP', inp);
        });
      });
      inpObserver.observe({ entryTypes: ['interaction'] });
      this.observers.push(inpObserver);

    } catch (error) {
      logger.error('Failed to observe Web Vitals', error as Error);
    }
  }

  private observeResources(): void {
    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        const resources = entryList.getEntries() as PerformanceResourceTiming[];
        this.analyzeResources(resources);
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      logger.error('Failed to observe resources', error as Error);
    }
  }

  private observeNavigation(): void {
    try {
      const navigationObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceNavigationTiming[];
        if (entries.length > 0) {
          this.analyzeNavigation(entries[0]);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      logger.error('Failed to observe navigation', error as Error);
    }
  }

  private observeInteractions(): void {
    try {
      // Observer les long tasks
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          this.trackLongTask(entry);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      logger.error('Failed to observe interactions', error as Error);
    }
  }

  private recordWebVital(name: keyof WebVitals, value: number): void {
    const rating = this.getWebVitalRating(name, value);

    logger.performance(name, value, 'ms');

    analytics.track('Web Vital', {
      metric: name,
      value,
      rating,
      page: window.location.pathname,
    });

    // Envoyer à Sentry si la métrique est pauvre
    if (rating === 'poor' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'performance',
        message: `Poor Web Vital: ${name}`,
        level: 'warning',
        data: { name, value, rating },
      });
    }
  }

  private getWebVitalRating(name: keyof WebVitals, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<keyof WebVitals, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private analyzeResources(resources: PerformanceResourceTiming[]): void {
    const totalSize = resources.reduce((sum, resource) => sum + resource.transferSize || 0, 0);
    const slowResources = resources.filter(resource => resource.duration > 1000);
    const failedResources = resources.filter(resource => resource.responseStatus >= 400);

    logger.performance('Resources loaded', resources.length, 'files');
    logger.performance('Total bundle size', totalSize / 1024, 'KB');

    if (slowResources.length > 0) {
      logger.warn(`Slow resources detected: ${slowResources.length}`, {
        slowResources: slowResources.map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
        })),
      });
    }

    if (failedResources.length > 0) {
      logger.error(`Failed resources detected: ${failedResources.length}`, {
        failedResources: failedResources.map(r => ({
          name: r.name,
          status: r.responseStatus,
        })),
      });
    }

    analytics.track('Resources Analysis', {
      totalResources: resources.length,
      totalSizeKB: Math.round(totalSize / 1024),
      slowResources: slowResources.length,
      failedResources: failedResources.length,
    });
  }

  private analyzeNavigation(navigation: PerformanceNavigationTiming): void {
    const metrics = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ssl: navigation.secureConnectionStart > 0
        ? navigation.connectEnd - navigation.secureConnectionStart
        : 0,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
      load: navigation.loadEventStart - navigation.domContentLoadedEventStart,
    };

    Object.entries(metrics).forEach(([metric, value]) => {
      logger.performance(`Navigation ${metric}`, value, 'ms');
    });

    analytics.track('Navigation Performance', {
      dnsTime: metrics.dns,
      tcpTime: metrics.tcp,
      sslTime: metrics.ssl,
      ttfb: metrics.ttfb,
      downloadTime: metrics.download,
      domParseTime: metrics.domParse,
      loadTime: metrics.load,
    });
  }

  private trackLongTask(entry: PerformanceEntry): void {
    logger.warn(`Long task detected: ${entry.duration}ms`, {
      startTime: entry.startTime,
      duration: entry.duration,
    });

    analytics.track('Long Task', {
      duration: entry.duration,
      startTime: entry.startTime,
    });
  }

  public getMetrics(): PerformanceMetrics | null {
    if (!this.isSupported) return null;

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const paint = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      const memory = (performance as any).memory || {};

      return {
        navigation,
        resources,
        paint,
        memory,
        vitals: {
          LCP: 0,
          FID: 0,
          CLS: 0,
          FCP: 0,
          TTFB: navigation?.responseStart - navigation?.requestStart || 0,
          INP: 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get performance metrics', error as Error);
      return null;
    }
  }

  public measurePageLoad(pageName: string): void {
    if (!this.isSupported) return;

    try {
      // Utiliser l'API Performance pour mesurer le temps de chargement
      performance.mark(`${pageName}-start`);

      // Marquer la fin du chargement quand tout est prêt
      setTimeout(() => {
        performance.mark(`${pageName}-end`);
        performance.measure(
          `${pageName} Load Time`,
          `${pageName}-start`,
          `${pageName}-end`
        );

        const measure = performance.getEntriesByName(`${pageName} Load Time`)[0];
        if (measure) {
          logger.performance(`${pageName} load time`, measure.duration, 'ms');
          analytics.trackPageLoad(pageName, measure.duration);
        }
      }, 0);
    } catch (error) {
      logger.error('Failed to measure page load', error as Error);
    }
  }

  public measureRenderTime(componentName: string, renderFn: () => void): void {
    if (!this.isSupported) {
      renderFn();
      return;
    }

    try {
      performance.mark(`${componentName}-render-start`);
      renderFn();
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName} Render Time`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );

      const measure = performance.getEntriesByName(`${componentName} Render Time`)[0];
      if (measure) {
        logger.performance(`${componentName} render time`, measure.duration, 'ms');

        if (measure.duration > 100) {
          logger.warn(`Slow render detected: ${componentName}`, {
            duration: measure.duration,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to measure render time', error as Error);
    }
  }

  public measureApiCall(apiName: string, apiCall: () => Promise<any>): Promise<any> {
    if (!this.isSupported) {
      return apiCall();
    }

    const startMark = `${apiName}-api-start`;
    const endMark = `${apiName}-api-end`;

    try {
      performance.mark(startMark);

      return apiCall().finally(() => {
        performance.mark(endMark);
        performance.measure(
          `${apiName} API Call`,
          startMark,
          endMark
        );

        const measure = performance.getEntriesByName(`${apiName} API Call`)[0];
        if (measure) {
          logger.performance(`${apiName} API call`, measure.duration, 'ms');
          analytics.trackApiCall('POST', apiName, 200, measure.duration);

          if (measure.duration > 3000) {
            logger.warn(`Slow API call: ${apiName}`, {
              duration: measure.duration,
            });
          }
        }
      });
    } catch (error) {
      performance.mark(endMark);
      performance.measure(
        `${apiName} API Call (Failed)`,
        startMark,
        endMark
      );

      const measure = performance.getEntriesByName(`${apiName} API Call (Failed)`)[0];
      if (measure) {
        logger.performance(`${apiName} API call (failed)`, measure.duration, 'ms');
        analytics.trackApiCall('POST', apiName, 500, measure.duration);
      }

      throw error;
    }
  }

  public generatePerformanceReport(): PerformanceObserverEntry[] {
    const report: PerformanceObserverEntry[] = [];

    // Collecter toutes les métriques
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        report.push({
          name: 'Navigation Timing',
          value: navigation.loadEventEnd - navigation.navigationStart,
          id: 'nav',
          rating: this.getWebVitalRating('TTFB', navigation.responseStart - navigation.requestStart),
        });
      }

      const paint = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      paint.forEach(entry => {
        report.push({
          name: entry.name,
          value: entry.startTime,
          id: 'paint',
          rating: 'good',
        });
      });

      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const totalResourceTime = resources.reduce((sum, resource) => sum + resource.duration, 0);
      report.push({
        name: 'Total Resource Load Time',
        value: totalResourceTime,
        id: 'resources',
        rating: totalResourceTime > 5000 ? 'poor' : totalResourceTime > 2000 ? 'needs-improvement' : 'good',
      });
    } catch (error) {
      logger.error('Failed to generate performance report', error as Error);
    }

    return report;
  }

  public cleanup(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.error('Failed to disconnect performance observer', error as Error);
      }
    });
    this.observers = [];
  }
}

// Export du singleton
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export des types et classes
export { PerformanceMonitor };
export type { PerformanceMetrics, WebVitals, PerformanceObserverEntry };