const path = require("path");
const fs = require("fs");

const backendRoot = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const repoRoot = path.resolve(backendRoot, "..");
const uploadsPath = path.join(backendRoot, "uploads");
const complaintEvidencePath = path.join(uploadsPath, "complaints");
const distPath = path.join(repoRoot, "client", "dist");

fs.mkdirSync(complaintEvidencePath, { recursive: true });

module.exports = {
  backendRoot,
  repoRoot,
  uploadsPath,
  complaintEvidencePath,
  distPath,
};
