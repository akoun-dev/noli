/**
 * fetchWithTimeout — LOT E (résilience réseau).
 *
 * Enveloppe `fetch` avec un `AbortController` qui interrompt la requête au bout
 * de `timeoutMs` (12 s par défaut). Sans cela, un backend injoignable laisse la
 * promesse `fetch` en suspens indéfiniment : le `finally` qui remet `loading` à
 * false ne s'exécute jamais et l'écran reste bloqué en skeleton.
 *
 * En cas de dépassement, une `TimeoutError` est levée pour que l'appelant
 * distingue un timeout d'une autre erreur réseau et affiche un message clair
 * avec un bouton « Réessayer ».
 */

export const DEFAULT_FETCH_TIMEOUT_MS = 12_000;

export class TimeoutError extends Error {
  constructor(message = "La requête a expiré. Le serveur met trop de temps à répondre.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export interface FetchWithTimeoutOptions extends RequestInit {
  /** Délai avant abandon, en millisecondes (défaut : 12 000 ms). */
  timeoutMs?: number;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal, ...init }: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  // Propager un éventuel signal fourni par l'appelant vers notre controller.
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    // Abandon déclenché par notre minuteur (et non par l'appelant) → timeout.
    if (timedOut && !(signal?.aborted)) {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Message utilisateur normalisé pour une erreur réseau (timeout ou échec de
 * connexion), afin d'afficher un texte cohérent et actionnable partout.
 */
export function networkErrorMessage(err: unknown): string {
  if (err instanceof TimeoutError) {
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
