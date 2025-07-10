import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  uploadTime: number;
  memoryUsage: number;
  networkRequests: number;
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    uploadTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
  });

  const startTime = useRef<number>(0);
  const requestCount = useRef<number>(0);

  const startTimer = () => {
    startTime.current = performance.now();
  };

  const endTimer = (type: 'load' | 'upload') => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;

    setMetrics(prev => ({
      ...prev,
      [type === 'load' ? 'loadTime' : 'uploadTime']: duration,
    }));
  };

  const trackRequest = () => {
    requestCount.current += 1;
    setMetrics(prev => ({
      ...prev,
      networkRequests: requestCount.current,
    }));
  };

  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  };

  const updateMemoryUsage = () => {
    const memoryUsage = getMemoryUsage();
    setMetrics(prev => ({
      ...prev,
      memoryUsage,
    }));
  };

  useEffect(() => {
    // Update memory usage periodically
    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    startTimer,
    endTimer,
    trackRequest,
    updateMemoryUsage,
  };
}

// Hook for monitoring React Query performance
export function useQueryPerformance() {
  const [queryMetrics, setQueryMetrics] = useState<{
    totalQueries: number;
    activeQueries: number;
    cachedQueries: number;
    averageLoadTime: number;
  }>({
    totalQueries: 0,
    activeQueries: 0,
    cachedQueries: 0,
    averageLoadTime: 0,
  });

  const queryTimes = useRef<number[]>([]);

  const trackQuery = (loadTime: number) => {
    queryTimes.current.push(loadTime);
    const average = queryTimes.current.reduce((a, b) => a + b, 0) / queryTimes.current.length;

    setQueryMetrics(prev => ({
      ...prev,
      totalQueries: prev.totalQueries + 1,
      averageLoadTime: average,
    }));
  };

  return {
    queryMetrics,
    trackQuery,
  };
} 