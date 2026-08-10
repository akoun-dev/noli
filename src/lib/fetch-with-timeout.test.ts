import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithTimeout, isTimeoutError } from "./fetch-with-timeout";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("fetchWithTimeout", () => {
  it("renvoie la réponse quand fetch répond à temps", async () => {
    const resp = new Response("ok");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resp));
    await expect(fetchWithTimeout("/x")).resolves.toBe(resp);
  });

  it("rejette avec une TimeoutError au-delà du délai", async () => {
    vi.useFakeTimers();
    // fetch ne se résout jamais seul ; il rejette quand son signal est aborté.
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject((init.signal as AbortSignal).reason)
          );
        })
      )
    );

    const caught = fetchWithTimeout("/x", { timeoutMs: 1_000 }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(1_001);
    const err = await caught;

    expect(isTimeoutError(err)).toBe(true);
  });
});

describe("isTimeoutError", () => {
  it("distingue une TimeoutError d'une erreur ordinaire", () => {
    expect(isTimeoutError(new DOMException("x", "TimeoutError"))).toBe(true);
    expect(isTimeoutError(new Error("boom"))).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
  });
});
