import { describe, it, expect } from "vitest";
import { GET, POST, PUT, PATCH, DELETE } from "./route";

// TEC-RBAC-02 : une route /api/* inconnue doit renvoyer une 404 JSON propre,
// et non une page HTML en 200 (catch-all de page).
describe("catch-all /api/[...notfound]", () => {
  it("renvoie 404 + { error } sur toutes les méthodes", async () => {
    for (const handler of [GET, POST, PUT, PATCH, DELETE]) {
      const res = handler();
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    }
  });
});
