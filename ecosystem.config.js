module.exports = {
  apps: [{
    name: "noli",
    script: ".next/standalone/server.js",
    cwd: __dirname,
    env: {
      NODE_ENV: "production",
      PORT: 8080,
      DATABASE_URL: "file:./prisma/dev.db",
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
