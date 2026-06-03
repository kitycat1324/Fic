import { spawn } from "node:child_process";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const shouldRunMigrations = process.env.RUN_MIGRATIONS !== "false";

  if (shouldRunMigrations) {
    console.log("Running Prisma migrations before server start...");
    await run("npx", ["prisma", "migrate", "deploy"], {
      env: {
        ...process.env
      }
    });
  }

  const server = spawn("node", ["app.js"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production"
    }
  });

  server.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  server.on("error", (error) => {
    console.error("Failed to start app.js:", error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error("Production startup failed:", error);
  process.exit(1);
});
