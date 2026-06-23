const app = require("./app");
const { initDb, markDbDisconnected } = require("./config/db");
const env = require("./config/env");

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

const DB_RETRY_MS = 10000;

app.listen(env.PORT, env.HOST, () => {
  console.log(`Server running on ${env.HOST}:${env.PORT}`);
});

const connectToDb = async () => {
  try {
    await initDb();
    console.log(`MongoDB connected (${env.MONGODB_DB_NAME})`);
  } catch (err) {
    markDbDisconnected(err);
    console.error("DB error:", err.message);
    console.log(`Retrying DB connection in ${DB_RETRY_MS / 1000}s...`);
    setTimeout(connectToDb, DB_RETRY_MS);
  }
};

connectToDb();
