const path = require("path");

// Always load the backend environment file, regardless of the directory used
// to start Node (for example `npm run dev` from the repository root).
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const clientOrigins = String(
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const addLoopbackAlias = (value) => {
  try {
    const url = new URL(value);
    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
      return url.origin;
    }
    if (url.hostname === "127.0.0.1") {
      url.hostname = "localhost";
      return url.origin;
    }
  } catch {
    // Wildcard origins are handled by the matcher below.
  }
  return "";
};

const allowedClientOrigins = [
  ...new Set([
    ...clientOrigins,
    ...clientOrigins.map(addLoopbackAlias).filter(Boolean),
  ]),
];

const escapeRegex = (value) =>
  value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");

const clientOriginMatchers = allowedClientOrigins.map((value) => {
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
  CLIENT_ORIGINS: allowedClientOrigins,
  isAllowedOrigin,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "complaints_db",
  ADMIN_USERNAME: String(process.env.ADMIN_USERNAME || "admin")
    .trim()
    .toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
  UPLOADS_DIR: process.env.UPLOADS_DIR || "",
  CLOUDINARY_CLOUD_NAME: String(process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  CLOUDINARY_API_KEY: String(process.env.CLOUDINARY_API_KEY || "").trim(),
  CLOUDINARY_API_SECRET: String(process.env.CLOUDINARY_API_SECRET || "").trim(),
  N8N_CHATBOT_WEBHOOK_URL: String(process.env.N8N_CHATBOT_WEBHOOK_URL || "").trim(),
  N8N_CHATBOT_TIMEOUT_MS: process.env.N8N_CHATBOT_TIMEOUT_MS,
};
