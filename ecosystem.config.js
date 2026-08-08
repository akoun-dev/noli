const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────────────────────────
// Noli — Configuration PM2
//
// Point d'entrée : .next/standalone/server.js (build Next.js `output: standalone`)
//
// Lancement :
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup
// ─────────────────────────────────────────────────────────────────────────────

// Le serveur standalone de Next.js ne charge PAS .env automatiquement.
// On injecte donc les variables (Supabase, Resend, NEXTAUTH_*, ...) dans
// l'environnement PM2 — elles seront héritées par le process applicatif.
function loadEnvFile(file) {
  const abs = path.resolve(__dirname, file);
  if (!fs.existsSync(abs)) return;
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    const value = raw.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");

// S'assure que le dossier de logs existe (PM2 ne le crée pas).
fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });

module.exports = {
  apps: [
    {
      name: "noli",
      script: ".next/standalone/server.js",
      cwd: __dirname,

      // SQLite ne supporte pas les accès concurrents en écriture :
      // 1 seule instance, mode fork obligatoire.
      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        // 8080 = port écouté par l'app ET attendu par Caddy (reverse_proxy localhost:8080).
        // Les deux doivent coïncider, sinon 502 au proxy (audit déploiement O-5).
        PORT: process.env.PORT || 8080,
      },

      // Les NEXT_PUBLIC_* et autres secrets sont chargés depuis .env
      // (voir loadEnvFile ci-dessus) — ne rien committer en dur ici.

      watch: false,
      autorestart: true,
      restart_delay: 2000,
      exp_backoff_restart_delay: 1000,
      max_memory_restart: "500M",
      kill_timeout: 5000,

      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      time: true,
    },
  ],
};
