const complaintCategories = [
  "Perundungan & Bullying",
  "Kekerasan Fisik",
  "Kekerasan Verbal",
  "Pelecehan Seksual",
  "Pelecehan Non-Seksual",
  "Masalah Akademik",
  "Diskriminasi",
  "Pelanggaran Privasi",
  "Fasilitas & Keamanan",
  "Lainnya",
];

const complaintStatuses = ["submitted", "in_progress", "resolved", "rejected"];
const accountRequestStatuses = ["pending", "reviewed"];

const allowedEvidenceMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

module.exports = {
  complaintCategories,
  complaintStatuses,
  accountRequestStatuses,
  allowedEvidenceMimeTypes,
};
