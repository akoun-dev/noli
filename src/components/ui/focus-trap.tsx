import * as React from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { RemoveScroll } from 'react-remove-scroll';

interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onInteractOutside?: (event: MouseEvent | TouchEvent) => void;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  enabled = true,
  onEscapeKeyDown,
  onInteractOutside,
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <FocusScope
      trapped={enabled}
      onMountAutoFocus={(event) => {
        event.preventDefault();
        // Focus the first focusable element after mount
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        firstElement?.focus();
      }}
      onUnmountAutoFocus={(event) => {
        // Prevent focus jumping back when unmounting
        event.preventDefault();
      }}
    >
      <RemoveScroll enabled={enabled} allowPinchZoom>
        <div
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onEscapeKeyDown?.(event);
            }
          }}
          onPointerDownOutside={onInteractOutside}
          onFocusOutside={(event) => {
            // Prevent focus from leaving the trap
            event.preventDefault();
          }}
        >
          {children}
        </div>
      </RemoveScroll>
    </FocusScope>
  );
};