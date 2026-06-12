require("dotenv").config();

const clientOrigins = String(
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const escapeRegex = (value) =>
  value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");

const clientOriginMatchers = clientOrigins.map((value) => {
  if (!value.includes("*")) {
    return value;
  }

  return new RegExp(
    `^${escapeRegex(value).replace(/\\\*/g, ".*")}$`,
    "i"
  );
});

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return clientOriginMatchers.some((matcher) => {
    if (typeof matcher === "string") {
      return matcher === origin;
    }

    return matcher.test(origin);
  });
};

module.exports = {
  HOST: process.env.HOST || "0.0.0.0",
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_ORIGIN: clientOrigins[0] || "http://localhost:5173",
  CLIENT_ORIGINS: clientOrigins,
  isAllowedOrigin,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "complaints_db",
  ADMIN_USERNAME: String(process.env.ADMIN_USERNAME || "admin")
    .trim()
    .toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  UPLOADS_DIR: process.env.UPLOADS_DIR || "",
};
