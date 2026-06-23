const path = require("path");
const multer = require("multer");
const { accountRequestCardPath, complaintEvidencePath } = require("../paths");
const { generateFilenameToken } = require("../utils/security");
const createDiskUpload = ({
  destination,
  errorMessage,
  isAllowed,
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
    limits: { fileSize: 5 * 1024 * 1024 },
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
  errorMessage: "Format file tidak valid. Sistem hanya menerima foto dengan format JPEG, JPG, atau PNG.",
  isAllowed: (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    return validTypes.includes(file.mimetype);
  },
});
const uploadStudentCard = createDiskUpload({
  destination: accountRequestCardPath,
  errorMessage: "Format kartu pelajar harus berupa foto (JPEG, JPG, PNG).",
  isAllowed: (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    return validTypes.includes(file.mimetype);
  },
});

module.exports = {
  uploadEvidence,
  uploadStudentCard,
  multer,
};
