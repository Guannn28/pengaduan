const path = require("path");
const multer = require("multer");
const { complaintEvidencePath } = require("../config/paths");
const { allowedEvidenceMimeTypes } = require("../config/constants");
const { generateFilenameToken } = require("../utils/security");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, complaintEvidencePath);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${generateFilenameToken()}${extension}`);
  },
});

const uploadEvidence = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedEvidenceMimeTypes.has(file.mimetype)) {
      cb(new Error("Format bukti harus berupa foto atau video yang didukung."));
      return;
    }

    cb(null, true);
  },
});

module.exports = {
  uploadEvidence,
  multer,
};
