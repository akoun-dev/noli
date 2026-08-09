/**
 * fetch avec délai maximal (AbortController).
 *
 * Évite les états de chargement infinis (skeletons qui ne s'arrêtent jamais,
 * bouton muet) quand le backend ne répond pas : au-delà de `timeoutMs`, la
 * requête est annulée et rejette avec une erreur nommée `TimeoutError`.
 *
 * Usage :
 *   try {
 *     const res = await fetchWithTimeout("/api/...", { method: "POST", body });
 *     ...
 *   } catch (e) {
 *     if (isTimeoutError(e)) { ... } // message « le serveur met trop de temps »
 *   }
 */
export const DEFAULT_TIMEOUT_MS = 12_000;

export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
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
