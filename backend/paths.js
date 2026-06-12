const path = require("path");
const fs = require("fs");
const env = require("./config/env");

const backendRoot = __dirname ? path.resolve(__dirname) : path.join(process.cwd(), "backend");
const repoRoot = path.resolve(backendRoot, "..");
const uploadsPath = env.UPLOADS_DIR
  ? path.isAbsolute(env.UPLOADS_DIR)
    ? env.UPLOADS_DIR
    : path.resolve(repoRoot, env.UPLOADS_DIR)
  : path.join(repoRoot, "uploads");
const complaintEvidencePath = path.join(uploadsPath, "complaints");
const accountRequestCardPath = path.join(uploadsPath, "account-requests");
const distPath = path.join(repoRoot, "client", "dist");

fs.mkdirSync(complaintEvidencePath, { recursive: true });
fs.mkdirSync(accountRequestCardPath, { recursive: true });

module.exports = {
  backendRoot,
  repoRoot,
  uploadsPath,
  complaintEvidencePath,
  accountRequestCardPath,
  distPath,
};
