const path = require("path");
const multer = require("multer");
const { accountRequestCardPath, complaintEvidencePath } = require("../config/paths");
const { allowedEvidenceMimeTypes } = require("../config/constants");
const { generateFilenameToken } = require("../utils/security");

const createDiskUpload = ({
  destination,
  errorMessage,
  isAllowed = (file) => allowedEvidenceMimeTypes.has(file.mimetype),
}) =>
  multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, destination);
      },
      filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || "");
        cb(null, `${Date.now()}-${generateFilenameToken()}${extension}`);
      },
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!isAllowed(file)) {
        cb(new Error(errorMessage));
        return;
      }

      cb(null, true);
    },
  });

const uploadEvidence = createDiskUpload({
  destination: complaintEvidencePath,
  errorMessage: "Format bukti harus berupa foto atau video yang didukung.",
});

const uploadStudentCard = createDiskUpload({
  destination: accountRequestCardPath,
  errorMessage: "Format kartu pelajar harus berupa foto yang didukung.",
  isAllowed: (file) => file.mimetype.startsWith("image/"),
});

module.exports = {
  uploadEvidence,
  uploadStudentCard,
  multer,
};
