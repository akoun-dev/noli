module.exports = {
  apps: [{
    name: "noli",
    script: ".next/standalone/server.js",
    cwd: __dirname,
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      // Les identifiants Supabase (NEXT_PUBLIC_SUPABASE_URL,
      // NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
      // RESEND_API_KEY, NEXT_PUBLIC_SITE_URL) doivent être fournis via un
      // fichier .env chargé par le shell / le gestionnaire de secrets —
      // ne jamais les committer ici. Voir deploiement.md.
    },
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "500M",
    error_file: "logs/pm2-error.log",
    out_file: "logs/pm2-out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    kill_timeout: 5000,
    restart_delay: 2000,
  }],
};
