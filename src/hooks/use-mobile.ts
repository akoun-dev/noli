import * as React from "react"

// Aligné sur le breakpoint `md` de Tailwind (768px) : mobile = < 768px.
const MOBILE_BREAKPOINT = 768

/**
 * UI-H05 : détection mobile sans flash d'état.
 * - Le premier rendu (SSR) retourne false (desktop) ;
 * - Le useEffect synchronise immédiatement avec mql.matches (pas de fenêtre
 *   où le rendu est incorrect au montage côté client) ;
 * - La callback onChange utilise mql.matches plutôt que window.innerWidth.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    mql.addEventListener("change", onChange)
    // Synchronisation immédiate au montage (évite le flash).
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
