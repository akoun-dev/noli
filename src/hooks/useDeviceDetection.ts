import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  screenSize: {
    width: number;
    height: number;
  };
  pixelRatio: number;
  touchSupport: boolean;
  maxTouchPoints: number;
}

const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Device type detection
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
    (screenWidth < 768 && 'ontouchstart' in window);

  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
    (screenWidth >= 768 && screenWidth < 1024 && 'ontouchstart' in window);

  const isDesktop = !isMobile && !isTablet;

  // OS detection
  const isIOS = /iphone|ipad|ipod/i.test(userAgent) ||
    (/mac/i.test(userAgent) && 'ontouchend' in document);

  const isAndroid = /android/i.test(userAgent);

  // Browser detection
  const isSafari = /safari/i.test(userAgent) && !/chrome|chromium|edg/i.test(userAgent);
  const isChrome = /chrome|chromium/i.test(userAgent);
  const isFirefox = /firefox|fxios/i.test(userAgent);

  // Orientation detection
  const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

  // Touch support
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    orientation,
    screenSize: {
      width: screenWidth,
      height: screenHeight
    },
    pixelRatio,
    touchSupport,
    maxTouchPoints
  };
};

export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
}

// Hook pour détecter les capacités du device
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    webp: false,
    avif: false,
    webm: false,
    hls: false,
    geolocation: false,
    camera: false,
    microphone: false,
    notifications: false,
    bluetooth: false,
    serviceWorker: false,
    indexedDB: false,
    localStorage: false,
    sessionStorage: false,
    webgl: false,
    webgl2: false
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities = { ...capabilities };

      // Image format support
      const webp = new Image();
      webp.onload = () => { newCapabilities.webp = true; };
      webp.onerror = () => { newCapabilities.webp = false; };
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

      const avif = new Image();
      avif.onload = () => { newCapabilities.avif = true; };
      avif.onerror = () => { newCapabilities.avif = false; };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';

      const video = document.createElement('video');
      newCapabilities.webm = video.canPlayType('video/webm; codecs="vp8, vorbis"') !== '';
      newCapabilities.hls = video.canPlayType('application/x-mpegURL; codecs="avc1.42E01E"') !== '';

      // Feature detection
      newCapabilities.geolocation = 'geolocation' in navigator;
      newCapabilities.camera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      newCapabilities.microphone = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      newCapabilities.notifications = 'Notification' in window && 'Notification.permission' in window.Notification;
      newCapabilities.bluetooth = 'bluetooth' in navigator;
      newCapabilities.serviceWorker = 'serviceWorker' in navigator;
      newCapabilities.indexedDB = 'indexedDB' in window;
      newCapabilities.localStorage = 'localStorage' in window;
      newCapabilities.sessionStorage = 'sessionStorage' in window;

      // WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      newCapabilities.webgl = !!gl;

      const gl2 = canvas.getContext('webgl2');
      newCapabilities.webgl2 = !!gl2;

      // Request notification permission
      if ('Notification' in window) {
        try {
          await Notification.requestPermission();
        } catch (e) {
          console.log('Notification permission not requested');
        }
      }

      setCapabilities(newCapabilities);
    };

    checkCapabilities();
  }, []);

  return capabilities;
}

// Hook pour obtenir les préférences système
export function useSystemPreferences() {
  const [preferences, setPreferences] = useState({
    darkMode: false,
    reducedMotion: false,
    highContrast: false,
    dataSaver: false
  });

  useEffect(() => {
    const checkPreferences = () => {
      setPreferences({
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        dataSaver: 'connection' in navigator &&
          (navigator.connection as any)?.saveData === true ||
          (navigator as any).connection?.effectiveType === 'slow-2g' ||
          (navigator as any).connection?.effectiveType === '2g'
      });
    };

    checkPreferences();

    const mediaQueries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', checkPreferences);
    });

    if ('connection' in navigator) {
      (navigator.connection as any).addEventListener('change', checkPreferences);
    }

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', checkPreferences);
      });
    };
  }, []);

  return preferences;
}

// Hook pour gérer les events mobiles
export function useMobileEvents() {
  const deviceInfo = useDeviceDetection();

  const handleTap = (callback: (event: TouchEvent) => void) => {
    return (event: React.TouchEvent) => {
      if (deviceInfo.touchSupport) {
        callback(event.nativeEvent);
      }
    };
  };

  const handleSwipe = (
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void
  ) => {
    return (event: React.TouchEvent) => {
      if (!deviceInfo.touchSupport) return;

      const touch = event.nativeEvent.changedTouches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      const handleEnd = (endEvent: TouchEvent) => {
        const endTouch = endEvent.changedTouches[0];
        const endX = endTouch.clientX;
        const endY = endTouch.clientY;

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (Math.max(absDeltaX, absDeltaY) > 50) {
          if (absDeltaX > absDeltaY) {
            if (deltaX > 0) {
              onSwipeRight?.();
            } else {
              onSwipeLeft?.();
            }
          } else {
            if (deltaY > 0) {
              onSwipeDown?.();
            } else {
              onSwipeUp?.();
            }
          }
        }

        document.removeEventListener('touchend', handleEnd);
      };

      document.addEventListener('touchend', handleEnd, { once: true });
    };
  };

  return {
    handleTap,
    handleSwipe
  };
}