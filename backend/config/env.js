require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/complaints_db";

const MONGODB_DB_NAME =
  process.env.MONGODB_DB_NAME ||
  (() => {
    try {
      const pathname = new URL(MONGODB_URI).pathname.replace(/^\/+/, "");
      return pathname || "complaints_db";
    } catch {
      return "complaints_db";
    }
  })();

module.exports = {
  PORT: process.env.PORT || 4000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  MONGODB_URI,
  MONGODB_DB_NAME,
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "admin@ubl.ac.id").trim().toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
};
