import { injectSpeedInsights } from '@vercel/speed-insights';

// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  private constructor() {
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackMetric('navigation_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
            this.trackMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          }
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.trackMetric('resource_load_time', resourceEntry.duration);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);

      // Monitor paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            const paintEntry = entry as PerformancePaintTiming;
            this.trackMetric(`paint_${paintEntry.name}`, paintEntry.startTime);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    }
  }

  trackMetric(name: string, value: number) {
    this.metrics.set(name, value);
    
    // Send to Speed Insights if available
    if (typeof window !== 'undefined' && (window as any).speedInsights) {
      (window as any).speedInsights.track(name, value);
    }
  }

  startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.trackMetric(name, duration);
    };
  }

  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024); // MB
      this.trackMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024); // MB
      this.trackMetric('memory_limit', memory.jsHeapSizeLimit / 1024 / 1024); // MB
    }
  }

  trackNetworkRequests() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        let totalRequests = 0;
        let totalDuration = 0;
        
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            totalRequests++;
            totalDuration += entry.duration;
          }
        }
        
        this.trackMetric('total_network_requests', totalRequests);
        this.trackMetric('average_request_duration', totalDuration / totalRequests);
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('network', observer);
    }
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics() {
    this.metrics.clear();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// React hook for performance monitoring
export function usePerformanceTracking(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  const trackRender = () => {
    const endTimer = monitor.startTimer(`${componentName}_render`);
    return () => endTimer();
  };

  const trackInteraction = (action: string) => {
    const endTimer = monitor.startTimer(`${componentName}_${action}`);
    return () => endTimer();
  };

  return {
    trackRender,
    trackInteraction,
    trackMetric: monitor.trackMetric.bind(monitor),
  };
}

// Initialize Speed Insights with enhanced monitoring
export function initializeSpeedInsights() {
  // Initialize Speed Insights
  injectSpeedInsights();
  
  // Initialize our performance monitor
  const monitor = PerformanceMonitor.getInstance();
  
  // Start periodic memory tracking
  setInterval(() => {
    monitor.trackMemoryUsage();
  }, 10000); // Every 10 seconds
  
  // Track network requests
  monitor.trackNetworkRequests();
  
  return monitor;
} 