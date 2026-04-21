const normalizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

const normalizeComplaint = (complaint) => ({
  id: complaint._id.toString(),
  userId: complaint.userId ? complaint.userId.toString() : null,
  name: complaint.name,
  email: complaint.email,
  category: complaint.category,
  message: complaint.message,
  evidenceUrl: complaint.evidenceUrl || "",
  evidenceType: complaint.evidenceType || "",
  evidenceName: complaint.evidenceName || "",
  status: complaint.status,
  createdAt: complaint.createdAt,
  updatedAt: complaint.updatedAt,
});

module.exports = {
  normalizeUser,
  normalizeComplaint,
};
