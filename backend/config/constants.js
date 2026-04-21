const complaintCategories = [
  "Sarana dan Prasarana",
  "Akademik",
  "Kasus Pembulian",
  "Administrasi",
  "Lainnya",
];

const complaintStatuses = ["submitted", "in_progress", "resolved", "rejected"];

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
  allowedEvidenceMimeTypes,
};
