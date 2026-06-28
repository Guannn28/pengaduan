const multer = require("multer");
const { allowedEvidenceMimeTypes } = require("../constants");

const allowedStudentCardMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const createMemoryUpload = ({
  errorMessage,
  isAllowed,
}) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!isAllowed(file)) {
        cb(new Error(errorMessage));
        return;
      }

      cb(null, true);
    },
  });

const uploadEvidence = createMemoryUpload({
  errorMessage: "Format file bukti tidak valid. Sistem hanya menerima gambar atau video umum.",
  isAllowed: (file) => allowedEvidenceMimeTypes.has(file.mimetype),
});

const uploadStudentCard = createMemoryUpload({
  errorMessage: "Format kartu pelajar harus berupa foto (JPEG, JPG, PNG, atau WEBP).",
  isAllowed: (file) => allowedStudentCardMimeTypes.has(file.mimetype),
});

module.exports = {
  uploadEvidence,
  uploadStudentCard,
  multer,
};
