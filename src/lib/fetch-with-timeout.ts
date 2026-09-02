/**
 * fetch avec délai maximal (AbortController) — résilience réseau (LOT E).
 *
 * Enveloppe `fetch` avec un `AbortController` qui interrompt la requête au bout
 * de `timeoutMs` (12 s par défaut). Sans cela, un backend injoignable laisse la
 * promesse `fetch` en suspens indéfiniment : le `finally` qui remet `loading` à
 * false ne s'exécute jamais et l'écran reste bloqué en skeleton.
 *
 * En cas de dépassement, la requête est annulée et rejette avec un
 * `DOMException` nommé `TimeoutError`. Utilisez `isTimeoutError` pour distinguer
 * un timeout d'une autre erreur réseau, et `networkErrorMessage` pour afficher
 * un message utilisateur normalisé et actionnable.
 *
 * Usage :
 *   try {
 *     const res = await fetchWithTimeout("/api/...", { method: "POST", body });
 *     ...
 *   } catch (e) {
 *     if (isTimeoutError(e)) { ... } // « le serveur met trop de temps »
 *     toast({ description: networkErrorMessage(e) });
 *   }
 */

export const DEFAULT_TIMEOUT_MS = 12_000;

/** Alias rétro-compatible pour l'ancien nom du délai par défaut. */
export const DEFAULT_FETCH_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

export interface FetchWithTimeoutOptions extends RequestInit {
  /** Délai avant abandon, en millisecondes (défaut : 12 000 ms). */
  timeoutMs?: number;
}

/** Vrai si l'erreur provient de l'expiration du délai (et non d'un autre échec). */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("La requête a expiré", "TimeoutError")),
    timeoutMs
  );

  // Respecte un éventuel signal fourni par l'appelant (composition).
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Message utilisateur normalisé pour une erreur réseau (timeout ou échec de
 * connexion), afin d'afficher un texte cohérent et actionnable partout.
 */
export function networkErrorMessage(err: unknown): string {
  if (isTimeoutError(err)) {
    return "Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez.";
  }
  if (err instanceof TypeError) {
    // fetch lève un TypeError quand la connexion échoue (backend injoignable).
    return "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.";
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}
