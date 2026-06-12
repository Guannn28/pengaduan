const path = require("path");
const multer = require("multer");
const { accountRequestCardPath, complaintEvidencePath } = require("../paths");
const { generateFilenameToken } = require("../utils/security");

/**
 * Konfigurasi factory middleware Multer untuk memproses unggahan file multipart/form-data.
 * Fungsi ini menggunakan DiskStorage untuk menyimpan file fisik secara lokal di dalam folder uploads/
 * guna memenuhi skenario sistem pengaduan yang tidak menggunakan cloud storage eksternal.
 * 
 * @param {Object} options - Konfigurasi opsi unggahan.
 * @param {string} options.destination - Path direktori penyimpanan file.
 * @param {string} options.errorMessage - Pesan error jika ekstensi/tipe file tidak diizinkan.
 * @param {Function} options.isAllowed - Fungsi callback validasi format file berdasarkan mimetype.
 * @returns {multer.Multer} Instance middleware multer siap pakai untuk endpoint express.
 */
const createDiskUpload = ({
  destination,
  errorMessage,
  isAllowed,
}) =>
  multer({
    // Mendefinisikan konfigurasi disk storage lokal (tidak langsung ke memory)
    storage: multer.diskStorage({
      // Menentukan target direktori tempat file fisik akan ditulis.
      destination: (_req, _file, cb) => {
        cb(null, destination);
      },
      // Mengamankan penamaan file agar tidak bentrok atau mengandung karakter berbahaya (Path Traversal Protection)
      // Menggunakan kombinasi Date.now() + token acak (generateFilenameToken).
      filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || "");
        cb(null, `${Date.now()}-${generateFilenameToken()}${extension}`);
      },
    }),
    // Menambahkan batasan ukuran file maksimum untuk mencegah serangan DDoS akibat payload raksasa.
    // Dibatasi ke 5 Megabytes (5 * 1024 * 1024) sesuai dengan kebutuhan skripsi (pembatasan 5MB).
    limits: { fileSize: 5 * 1024 * 1024 },
    
    // File Filter untuk memvalidasi tipe file sebelum disimpan ke disk.
    fileFilter: (_req, file, cb) => {
      if (!isAllowed(file)) {
        cb(new Error(errorMessage));
        return;
      }

      cb(null, true);
    },
  });

/**
 * Middleware untuk mengunggah foto/bukti kejadian.
 * Syarat: Harus berupa gambar (image/jpeg, image/png, image/jpg) dan maksimal ukuran 5MB.
 */
const uploadEvidence = createDiskUpload({
  destination: complaintEvidencePath,
  errorMessage: "Format file tidak valid. Sistem hanya menerima foto dengan format JPEG, JPG, atau PNG.",
  isAllowed: (file) => {
    // Membatasi validasi secara eksplisit pada MimeType foto saja
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    return validTypes.includes(file.mimetype);
  },
});

/**
 * Middleware untuk mengunggah foto kartu pelajar.
 * Syarat: Sama halnya seperti foto bukti kejadian (image types only).
 */
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
