import { useEffect, useRef } from 'react';
import api from '../services/api';

type TelemetryEntry = {
  method: string;
  url: string;
  duration: number;
  status: number;
  timestamp: number;
};

const MAX_ENTRIES = 200;

export function useTelemetry() {
  const entries = useRef<TelemetryEntry[]>([]);

  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use((config) => {
      (config as any)._start = performance.now();
      return config;
    });

    const resInterceptor = api.interceptors.response.use(
      (res) => {
        const start = (res.config as any)._start;
        if (start) {
          entries.current.push({
            method: res.config.method?.toUpperCase() || 'GET',
            url: res.config.url || '',
            duration: performance.now() - start,
            status: res.status,
            timestamp: Date.now(),
          });
          if (entries.current.length > MAX_ENTRIES) entries.current.shift();
        }
        return res;
      },
      (err) => {
        const start = (err.config as any)?._start;
        if (start && err.config?.url) {
          entries.current.push({
            method: err.config.method?.toUpperCase() || 'GET',
            url: err.config.url || '',
            duration: performance.now() - start,
            status: err.response?.status || 0,
            timestamp: Date.now(),
          });
          if (entries.current.length > MAX_ENTRIES) entries.current.shift();
        }
        return Promise.reject(err);
      },
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const getStats = () => {
    const total = entries.current.length;
    if (!total) return null;

    const errors = entries.current.filter((e) => e.status >= 400).length;
    const avgDuration = entries.current.reduce((s, e) => s + e.duration, 0) / total;
    const slowest = [...entries.current].sort((a, b) => b.duration - a.duration)[0];
    const recent = entries.current.slice(-50);

    return { total, errors, avgDuration, slowest, recent };
  };

  return { getStats, entries: entries.current };
}
