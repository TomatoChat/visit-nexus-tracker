import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMonitor } from '@/lib/performance';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetrics {
  [key: string]: number;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    
    // Update metrics every second
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatMetric = (value: number, unit: string = 'ms') => {
    if (value < 1000) {
      return `${value.toFixed(2)} ${unit}`;
    }
    return `${(value / 1000).toFixed(2)} s`;
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.5) return 'bg-green-500';
    if (value <= threshold) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Dashboard"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Memory Usage */}
          {metrics.memory_used && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span className="font-mono">{metrics.memory_used.toFixed(1)} MB</span>
              </div>
              <Progress 
                value={(metrics.memory_used / (metrics.memory_limit || 100)) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* Load Times */}
          {metrics.navigation_load_time && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Page Load</span>
                <span className="font-mono">{formatMetric(metrics.navigation_load_time)}</span>
              </div>
              <div className={`h-1 rounded ${getPerformanceColor(metrics.navigation_load_time, 3000)}`} />
            </div>
          )}

          {metrics.dom_content_loaded && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>DOM Ready</span>
                <span className="font-mono">{formatMetric(metrics.dom_content_loaded)}</span>
              </div>
              <div className={`h-1 rounded ${getPerformanceColor(metrics.dom_content_loaded, 1000)}`} />
            </div>
          )}

          {/* Paint Times */}
          {metrics.paint_first_paint && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>First Paint</span>
                <span className="font-mono">{formatMetric(metrics.paint_first_paint)}</span>
              </div>
              <div className={`h-1 rounded ${getPerformanceColor(metrics.paint_first_paint, 1000)}`} />
            </div>
          )}

          {metrics.paint_first_contentful_paint && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>First Contentful Paint</span>
                <span className="font-mono">{formatMetric(metrics.paint_first_contentful_paint)}</span>
              </div>
              <div className={`h-1 rounded ${getPerformanceColor(metrics.paint_first_contentful_paint, 1500)}`} />
            </div>
          )}

          {/* Network Metrics */}
          {metrics.total_network_requests && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Network Requests</span>
                <span className="font-mono">{metrics.total_network_requests}</span>
              </div>
            </div>
          )}

          {metrics.average_request_duration && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg Request Time</span>
                <span className="font-mono">{formatMetric(metrics.average_request_duration)}</span>
              </div>
            </div>
          )}

          {/* Component Render Times */}
          {Object.keys(metrics).filter(key => key.includes('_render')).map(key => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{key.replace('_render', '').replace(/_/g, ' ')}</span>
                <span className="font-mono">{formatMetric(metrics[key])}</span>
              </div>
              <div className={`h-1 rounded ${getPerformanceColor(metrics[key], 100)}`} />
            </div>
          ))}

          {/* Interaction Times */}
          {Object.keys(metrics).filter(key => key.includes('_interaction')).map(key => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{key.replace('_interaction', '').replace(/_/g, ' ')}</span>
                <span className="font-mono">{formatMetric(metrics[key])}</span>
              </div>
              <div className={`h-1 rounded ${getPerformanceColor(metrics[key], 100)}`} />
            </div>
          ))}

          {Object.keys(metrics).length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              No metrics available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard; 