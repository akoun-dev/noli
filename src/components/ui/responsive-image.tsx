import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

const generateSrcSet = (baseSrc: string, format: string = 'auto') => {
  const supportedFormats = ['webp', 'avif', 'jpeg', 'png'];
  const widths = [320, 640, 768, 1024, 1280, 1536, 1920, 2048];

  return widths.map(width => {
    let formatSuffix = '';

    if (format === 'auto') {
      // Prioritize modern formats
      if (baseSrc.includes('.jpg') || baseSrc.includes('.jpeg')) {
        formatSuffix = `.webp`;
      } else if (baseSrc.includes('.png')) {
        formatSuffix = `.webp`;
      }
    } else if (format !== 'jpeg' && format !== 'png') {
      formatSuffix = `.${format}`;
    }

    const cleanSrc = baseSrc.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    return `${cleanSrc}${formatSuffix}?w=${width}&q=80 ${width}w`;
  }).join(', ');
};

const generateSizes = (defaultSizes: string = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw') => {
  return defaultSizes;
};

const generateBlurDataURL = (width: number = 20, height: number = 20) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, width, height);

    // Add noise for more realistic placeholder
    for (let i = 0; i < width * height; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const opacity = Math.random() * 0.5;
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas.toDataURL();
};

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  quality = 80,
  format = 'auto',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  style
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const generatedBlurDataURL = blurDataURL || generateBlurDataURL(width, height);
  const generatedSrcSet = generateSrcSet(src, format);
  const generatedSizes = sizes || generateSizes();

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setIsError(true);
      onError?.();
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [onLoad, onError]);

  if (isError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground rounded-lg',
          className
        )}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm">Image non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {!isLoaded && placeholder === 'blur' && (
        <div
          className="absolute inset-0 blur-sm"
          style={{
            backgroundImage: `url(${generatedBlurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      <img
        ref={imgRef}
        src={src}
        srcSet={generatedSrcSet}
        sizes={generatedSizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          width: width || '100%',
          height: height || 'auto',
          ...style
        }}
      />
    </div>
  );
};

// Composant pour les images de profil
interface ProfileImageProps extends Omit<ResponsiveImageProps, 'placeholder'> {
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  fallbackText,
  size = 'md',
  className,
  ...props
}) => {
  const [isError, setIsError] = useState(false);

  const sizeMap = {
    sm: { width: 32, height: 32, className: 'h-8 w-8 text-xs' },
    md: { width: 48, height: 48, className: 'h-12 w-12 text-sm' },
    lg: { width: 64, height: 64, className: 'h-16 w-16 text-base' },
    xl: { width: 96, height: 96, className: 'h-24 w-24 text-lg' }
  };

  const currentSize = sizeMap[size];

  if (isError || !props.src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium',
          currentSize.className,
          className
        )}
      >
        {fallbackText?.slice(0, 2).toUpperCase() || 'U'}
      </div>
    );
  }

  return (
    <ResponsiveImage
      {...props}
      {...currentSize}
      className={cn('rounded-full object-cover', className)}
      placeholder="blur"
      onError={() => setIsError(true)}
    />
  );
};

// Composant pour les images de galerie
interface GalleryImageProps {
  src: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}

export const GalleryImage: React.FC<GalleryImageProps> = ({
  src,
  alt,
  onClick,
  className
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  return (
    <div
      className={cn(
        'relative aspect-square cursor-pointer overflow-hidden rounded-lg group',
        className
      )}
      onClick={onClick}
    >
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {!isError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
        />
      )}

      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center p-4">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Image non disponible</p>
          </div>
        </div>
      )}

      {/* Overlay for gallery images */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
    </div>
  );
};

// Hook pour optimiser le chargement des images
export function useImageOptimization() {
  const [isSupported, setIsSupported] = useState({
    webp: false,
    avif: false,
    lazy: true
  });

  useEffect(() => {
    // Check WebP support
    const webp = new Image();
    webp.onload = () => setIsSupported(prev => ({ ...prev, webp: true }));
    webp.onerror = () => setIsSupported(prev => ({ ...prev, webp: false }));
    webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

    // Check AVIF support
    const avif = new Image();
    avif.onload = () => setIsSupported(prev => ({ ...prev, avif: true }));
    avif.onerror = () => setIsSupported(prev => ({ ...prev, avif: false }));
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  }, []);

  const getOptimalFormat = () => {
    if (isSupported.avif) return 'avif';
    if (isSupported.webp) return 'webp';
    return 'jpeg';
  };

  return {
    ...isSupported,
    getOptimalFormat
  };
}