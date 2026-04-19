import { useEffect, useState } from 'react';

// Hook pour détecter si le focus est visible (navigation au clavier)
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    let hadKeyboardEvent = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') {
        hadKeyboardEvent = true;
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      hadKeyboardEvent = false;
      setIsFocusVisible(false);
    };

    const handleFocus = (event: FocusEvent) => {
      if (hadKeyboardEvent) {
        setIsFocusVisible(true);
        // Ajouter un attribut data-focus-visible pour le styling
        (event.target as HTMLElement).setAttribute('data-focus-visible', 'true');
      }
    };

    const handleBlur = (event: FocusEvent) => {
      setIsFocusVisible(false);
      // Retirer l'attribut data-focus-visible
      (event.target as HTMLElement).removeAttribute('data-focus-visible');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return isFocusVisible;
};

// Composant pour envelopper les éléments avec des styles de focus améliorés
interface FocusVisibleProviderProps {
  children: React.ReactNode;
}

export const FocusVisibleProvider: React.FC<FocusVisibleProviderProps> = ({ children }) => {
  const isFocusVisible = useFocusVisible();

  useEffect(() => {
    // Ajouter des styles globaux pour le focus visible
    const style = document.createElement('style');
    style.textContent = `
      [data-focus-visible="true"] {
        outline: 2px solid hsl(var(--ring));
        outline-offset: 2px;
        border-radius: 4px;
      }

      [data-focus-visible="true"]:focus {
        outline: 2px solid hsl(var(--ring));
        outline-offset: 2px;
      }

      /* Améliorer le focus pour les boutons */
      button[data-focus-visible="true"] {
        box-shadow: 0 0 0 2px hsl(var(--ring));
      }

      /* Améliorer le focus pour les inputs */
      input[data-focus-visible="true"],
      textarea[data-focus-visible="true"],
      select[data-focus-visible="true"] {
        box-shadow: 0 0 0 2px hsl(var(--ring));
        border-color: hsl(var(--ring));
      }

      /* Améliorer le focus pour les liens */
      a[data-focus-visible="true"] {
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
      }

      /* Masquer le outline par défaut mais le garder pour l'accessibilité */
      :focus:not([data-focus-visible="true"]) {
        outline: none;
      }

      /* S'assurer que le focus est visible en mode clavier */
      @media (prefers-reduced-motion: no-preference) {
        [data-focus-visible="true"] {
          transition: box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
};