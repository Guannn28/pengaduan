const fs = require("fs");
const path = require("path");
const { uploadsPath } = require("../paths");

const removeLocalEvidence = (evidenceUrl) => {
  if (!evidenceUrl || !evidenceUrl.startsWith("/uploads/")) return;

  const relativePath = evidenceUrl.replace(/^\/uploads\//, "");
  const targetPath = path.join(uploadsPath, relativePath);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
};

const getLocalEvidencePath = (evidenceUrl) => {
  if (!evidenceUrl || !evidenceUrl.startsWith("/uploads/")) return null;

  const relativePath = evidenceUrl.replace(/^\/uploads\//, "");
  const targetPath = path.resolve(uploadsPath, relativePath);
  const uploadsRoot = `${path.resolve(uploadsPath)}${path.sep}`;

  if (!targetPath.startsWith(uploadsRoot)) {
    return null;
  }

  return targetPath;
};

module.exports = {
  removeLocalEvidence,
  getLocalEvidencePath,
};
