require("dotenv").config();

if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI wajib diset di environment!");
}

module.exports = {
  PORT: process.env.PORT || 4000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "complaints_db",
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "admin@ubl.ac.id")
    .trim()
    .toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
};

console.log("=== ENV DEBUG ===");
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("DB NAME:", process.env.MONGODB_DB_NAME);