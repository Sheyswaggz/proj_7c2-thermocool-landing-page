/**
 * Performance Optimization Module
 * 
 * Provides comprehensive performance monitoring, lazy loading, and Core Web Vitals tracking
 * for optimal user experience and search engine optimization.
 * 
 * @module performance
 * @version 1.0.0
 */

(function() {
  'use strict';

  /**
   * Performance monitoring configuration
   */
  const PERFORMANCE_CONFIG = {
    lazyLoadRootMargin: '50px',
    lazyLoadThreshold: 0.01,
    performanceObserverBuffered: true,
    metricsReportingInterval: 30000,
    enableDebugLogging: false
  };

  /**
   * Core Web Vitals thresholds (in milliseconds)
   */
  const WEB_VITALS_THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 }
  };

  /**
   * Performance metrics storage
   */
  const performanceMetrics = {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null,
    navigationTiming: null,
    resourceTiming: []
  };

  /**
   * Lazy loading state management
   */
  const lazyLoadState = {
    observer: null,
    loadedImages: new WeakSet(),
    pendingImages: new Set()
  };

  /**
   * Logger utility with structured logging
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  function log(level, message, context = {}) {
    if (!PERFORMANCE_CONFIG.enableDebugLogging && level === 'info') {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      module: 'performance',
      ...context
    };

    const logMethod = console[level] || console.log;
    logMethod('[Performance]', message, context);
  }

  /**
   * Initialize Intersection Observer for lazy loading
   * @returns {IntersectionObserver|null} Configured observer instance
   */
  function initializeLazyLoadObserver() {
    if (!('IntersectionObserver' in window)) {
      log('warn', 'IntersectionObserver not supported, falling back to immediate loading');
      return null;
    }

    try {
      const observer = new IntersectionObserver(
        handleIntersection,
        {
          rootMargin: PERFORMANCE_CONFIG.lazyLoadRootMargin,
          threshold: PERFORMANCE_CONFIG.lazyLoadThreshold
        }
      );

      log('info', 'Lazy load observer initialized', {
        rootMargin: PERFORMANCE_CONFIG.lazyLoadRootMargin,
        threshold: PERFORMANCE_CONFIG.lazyLoadThreshold
      });

      return observer;
    } catch (error) {
      log('error', 'Failed to initialize lazy load observer', { error: error.message });
      return null;
    }
  }

  /**
   * Handle intersection observer callback
   * @param {IntersectionObserverEntry[]} entries - Observed entries
   * @param {IntersectionObserver} observer - Observer instance
   */
  function handleIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        loadImage(img);
        observer.unobserve(img);
        lazyLoadState.pendingImages.delete(img);
      }
    });
  }

  /**
   * Load image with error handling and performance tracking
   * @param {HTMLImageElement} img - Image element to load
   */
  function loadImage(img) {
    if (lazyLoadState.loadedImages.has(img)) {
      return;
    }

    const startTime = performance.now();
    const dataSrc = img.getAttribute('data-src');
    const dataSrcset = img.getAttribute('data-srcset');

    if (!dataSrc && !dataSrcset) {
      log('warn', 'Image missing data-src attribute', { element: img });
      return;
    }

    const loadPromise = new Promise((resolve, reject) => {
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        lazyLoadState.loadedImages.add(img);
        img.classList.add('loaded');
        
        log('info', 'Image loaded successfully', {
          src: dataSrc || dataSrcset,
          loadTime: `${loadTime.toFixed(2)}ms`
        });

        resolve();
      };

      img.onerror = () => {
        const loadTime = performance.now() - startTime;
        log('error', 'Image failed to load', {
          src: dataSrc || dataSrcset,
          loadTime: `${loadTime.toFixed(2)}ms`
        });

        img.classList.add('load-error');
        reject(new Error(`Failed to load image: ${dataSrc || dataSrcset}`));
      };

      if (dataSrcset) {
        img.srcset = dataSrcset;
      }
      if (dataSrc) {
        img.src = dataSrc;
      }
    });

    loadPromise.catch(error => {
      log('error', 'Image load promise rejected', { error: error.message });
    });
  }

  /**
   * Initialize lazy loading for images
   */
  function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    if (images.length === 0) {
      log('info', 'No lazy-loadable images found');
      return;
    }

    lazyLoadState.observer = initializeLazyLoadObserver();

    if (!lazyLoadState.observer) {
      images.forEach(img => {
        loadImage(img);
      });
      return;
    }

    images.forEach(img => {
      lazyLoadState.pendingImages.add(img);
      lazyLoadState.observer.observe(img);
    });

    log('info', 'Lazy loading initialized', { imageCount: images.length });
  }

  /**
   * Initialize Performance Observer for Core Web Vitals
   */
  function initializePerformanceObserver() {
    if (!('PerformanceObserver' in window)) {
      log('warn', 'PerformanceObserver not supported');
      return;
    }

    try {
      observeLargestContentfulPaint();
      observeFirstInputDelay();
      observeCumulativeLayoutShift();
      observeFirstContentfulPaint();
      observeNavigationTiming();
    } catch (error) {
      log('error', 'Failed to initialize performance observers', { error: error.message });
    }
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  function observeLargestContentfulPaint() {
    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        performanceMetrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        
        log('info', 'LCP measured', {
          value: `${performanceMetrics.LCP.toFixed(2)}ms`,
          rating: getRating(performanceMetrics.LCP, WEB_VITALS_THRESHOLDS.LCP)
        });
      });

      observer.observe({ 
        type: 'largest-contentful-paint', 
        buffered: PERFORMANCE_CONFIG.performanceObserverBuffered 
      });
    } catch (error) {
      log('error', 'Failed to observe LCP', { error: error.message });
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  function observeFirstInputDelay() {
    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          performanceMetrics.FID = entry.processingStart - entry.startTime;
          
          log('info', 'FID measured', {
            value: `${performanceMetrics.FID.toFixed(2)}ms`,
            rating: getRating(performanceMetrics.FID, WEB_VITALS_THRESHOLDS.FID)
          });
        });
      });

      observer.observe({ 
        type: 'first-input', 
        buffered: PERFORMANCE_CONFIG.performanceObserverBuffered 
      });
    } catch (error) {
      log('error', 'Failed to observe FID', { error: error.message });
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  function observeCumulativeLayoutShift() {
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            performanceMetrics.CLS = clsValue;
            
            log('info', 'CLS updated', {
              value: performanceMetrics.CLS.toFixed(4),
              rating: getRating(performanceMetrics.CLS, WEB_VITALS_THRESHOLDS.CLS)
            });
          }
        });
      });

      observer.observe({ 
        type: 'layout-shift', 
        buffered: PERFORMANCE_CONFIG.performanceObserverBuffered 
      });
    } catch (error) {
      log('error', 'Failed to observe CLS', { error: error.message });
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   */
  function observeFirstContentfulPaint() {
    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            performanceMetrics.FCP = entry.startTime;
            
            log('info', 'FCP measured', {
              value: `${performanceMetrics.FCP.toFixed(2)}ms`,
              rating: getRating(performanceMetrics.FCP, WEB_VITALS_THRESHOLDS.FCP)
            });
          }
        });
      });

      observer.observe({ 
        type: 'paint', 
        buffered: PERFORMANCE_CONFIG.performanceObserverBuffered 
      });
    } catch (error) {
      log('error', 'Failed to observe FCP', { error: error.message });
    }
  }

  /**
   * Observe Navigation Timing
   */
  function observeNavigationTiming() {
    if (!('PerformanceTiming' in window)) {
      log('warn', 'Navigation Timing API not supported');
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];

        if (navigation) {
          performanceMetrics.TTFB = navigation.responseStart - navigation.requestStart;
          
          performanceMetrics.navigationTiming = {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            ttfb: performanceMetrics.TTFB,
            download: timing.responseEnd - timing.responseStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            domComplete: timing.domComplete - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart
          };

          log('info', 'Navigation timing captured', performanceMetrics.navigationTiming);
          log('info', 'TTFB measured', {
            value: `${performanceMetrics.TTFB.toFixed(2)}ms`,
            rating: getRating(performanceMetrics.TTFB, WEB_VITALS_THRESHOLDS.TTFB)
          });
        }
      }, 0);
    });
  }

  /**
   * Get performance rating based on thresholds
   * @param {number} value - Metric value
   * @param {Object} thresholds - Threshold configuration
   * @returns {string} Rating (good, needs-improvement, poor)
   */
  function getRating(value, thresholds) {
    if (value <= thresholds.good) {
      return 'good';
    }
    if (value <= thresholds.needsImprovement) {
      return 'needs-improvement';
    }
    return 'poor';
  }

  /**
   * Get all performance metrics
   * @returns {Object} Current performance metrics
   */
  function getPerformanceMetrics() {
    return {
      ...performanceMetrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: getConnectionInfo()
    };
  }

  /**
   * Get network connection information
   * @returns {Object|null} Connection info or null if not available
   */
  function getConnectionInfo() {
    if (!('connection' in navigator)) {
      return null;
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return null;
    }

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  /**
   * Report performance metrics to console or analytics
   */
  function reportPerformanceMetrics() {
    const metrics = getPerformanceMetrics();
    
    log('info', 'Performance metrics report', metrics);

    if (window.gtag) {
      try {
        if (metrics.LCP) {
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(metrics.LCP),
            non_interaction: true
          });
        }

        if (metrics.FID) {
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'FID',
            value: Math.round(metrics.FID),
            non_interaction: true
          });
        }

        if (metrics.CLS) {
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'CLS',
            value: Math.round(metrics.CLS * 1000),
            non_interaction: true
          });
        }
      } catch (error) {
        log('error', 'Failed to report metrics to analytics', { error: error.message });
      }
    }

    return metrics;
  }

  /**
   * Optimize images by setting appropriate sizes
   */
  function optimizeImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }

      img.setAttribute('data-optimized', 'true');
    });

    log('info', 'Images optimized', { count: images.length });
  }

  /**
   * Prefetch critical resources
   */
  function prefetchCriticalResources() {
    const criticalResources = [
      { href: '/css/main.css', as: 'style' },
      { href: '/css/components.css', as: 'style' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource.href;
      link.as = resource.as;
      
      document.head.appendChild(link);
    });

    log('info', 'Critical resources prefetched', { count: criticalResources.length });
  }

  /**
   * Initialize all performance optimizations
   */
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializePerformanceOptimizations);
    } else {
      initializePerformanceOptimizations();
    }
  }

  /**
   * Main initialization function
   */
  function initializePerformanceOptimizations() {
    try {
      log('info', 'Initializing performance optimizations');

      initializeLazyLoading();
      initializePerformanceObserver();
      optimizeImages();
      prefetchCriticalResources();

      window.addEventListener('load', () => {
        setTimeout(reportPerformanceMetrics, 0);
      });

      setInterval(reportPerformanceMetrics, PERFORMANCE_CONFIG.metricsReportingInterval);

      log('info', 'Performance optimizations initialized successfully');
    } catch (error) {
      log('error', 'Failed to initialize performance optimizations', { error: error.message });
    }
  }

  window.ThermoCoolPerformance = {
    initialize,
    getMetrics: getPerformanceMetrics,
    reportMetrics: reportPerformanceMetrics,
    optimizeImages,
    config: PERFORMANCE_CONFIG
  };

  initialize();
})();