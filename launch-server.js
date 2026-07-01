const { spawn } = require("child_process");
const fs = require("fs");
const log = fs.openSync("/home/z/my-project/dev.log", "a");

const child = spawn("npx", ["next", "dev", "-p", "3000"], {
  cwd: "/home/z/my-project",
  stdio: ["ignore", log, log],
  detached: true,
});

child.unref();
console.log(`Started Next.js dev server PID: ${child.pid}`);
process.exit(0);