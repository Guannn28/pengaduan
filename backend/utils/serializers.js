const normalizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  className: user.className || "",
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

const normalizeAccountRequest = (request) => ({
  id: request._id.toString(),
  name: request.name,
  email: request.email,
  className: request.className || "",
  studentCardUrl: request.studentCardUrl || "",
  studentCardType: request.studentCardType || "",
  studentCardName: request.studentCardName || "",
  status: request.status,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

module.exports = {
  normalizeUser,
  normalizeComplaint,
  normalizeAccountRequest,
};
