import * as React from "react";

// Points de rupture pour différents types d'appareils
const BREAKPOINTS = {
  mobile: 480,      // Petits téléphones
  tablet: 768,      // Tablettes
  laptop: 1024,     // Ordinateurs portables
  desktop: 1280,    // Ordinateurs de bureau
  wide: 1536,       // Écrans larges
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.tablet - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.tablet);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < BREAKPOINTS.tablet);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// Hook pour détecter les tablettes
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.laptop - 1}px)`);
    const onChange = () => {
      setIsTablet(window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.laptop);
    };
    mql.addEventListener("change", onChange);
    setIsTablet(window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.laptop);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

// Hook pour détecter les ordinateurs portables
export function useIsLaptop() {
  const [isLaptop, setIsLaptop] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.laptop}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`);
    const onChange = () => {
      setIsLaptop(window.innerWidth >= BREAKPOINTS.laptop && window.innerWidth < BREAKPOINTS.desktop);
    };
    mql.addEventListener("change", onChange);
    setIsLaptop(window.innerWidth >= BREAKPOINTS.laptop && window.innerWidth < BREAKPOINTS.desktop);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isLaptop;
}

// Hook pour détecter les écrans larges
export function useIsWide() {
  const [isWide, setIsWide] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.wide}px)`);
    const onChange = () => {
      setIsWide(window.innerWidth >= BREAKPOINTS.wide);
    };
    mql.addEventListener("change", onChange);
    setIsWide(window.innerWidth >= BREAKPOINTS.wide);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isWide;
}

// Hook pour détecter l'orientation
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape' | undefined>(undefined);

  React.useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Écouter les changements d'orientation
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Définir l'orientation initiale
    handleOrientationChange();

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

// Hook pour obtenir la taille actuelle de l'écran
export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<{
    width: number | undefined;
    height: number | undefined;
  }>({ width: undefined, height: undefined });

  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

// Hook combiné pour détecter le type d'appareil
export function useDeviceType() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLaptop = useIsLaptop();
  const isWide = useIsWide();
  const orientation = useOrientation();
  const screenSize = useScreenSize();

  // Déterminer le type d'appareil principal
  let deviceType: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'wide' = 'mobile';
  if (isWide) deviceType = 'wide';
  else if (isLaptop) deviceType = 'laptop';
  else if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';

  return {
    isMobile,
    isTablet,
    isLaptop,
    isWide,
    deviceType,
    orientation,
    screenSize,
    breakpoints: BREAKPOINTS,
  };
}
