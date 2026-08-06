import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 🔒 SÉCURITÉ : Initialisation de l'authentification sécurisée au démarrage
import { SecureAuthService } from "./lib/secure-auth";
import { logger } from "./lib/logger";

// Initialiser le service d'authentification sécurisée
const secureAuthService = SecureAuthService.getInstance();
secureAuthService.initializeSecureAuth();
secureAuthService.cleanupLegacyTokens();

// Validation de la sécurité
const isSecure = secureAuthService.validateSecureStorage();
if (!isSecure) {
  logger.warn("⚠️ Attention : La configuration de stockage sécurisé nécessite une attention");
}

logger.auth("✅ Initialisation sécurisée terminée");

createRoot(document.getElementById("root")!).render(<App />);
