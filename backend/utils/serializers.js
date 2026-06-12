const normalizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  username: user.username || user.email || "",
  role: user.role,
  className: user.className || "",
});

const normalizeStudentAccount = (user) => ({
  id: user._id.toString(),
  name: user.name,
  username: user.username || user.email || "",
  className: user.className || "",
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeComplaint = (complaint, options = {}) => {
  const isAdminViewer = options.viewerRole === "admin";
  const isAnonymous = Boolean(complaint.isAnonymous);
  const hideReporter = isAdminViewer && isAnonymous;

  return {
    id: complaint._id.toString(),
    userId: hideReporter ? null : complaint.userId ? complaint.userId.toString() : null,
    name: hideReporter ? "Anonim" : complaint.name,
    username: hideReporter ? "" : complaint.username || complaint.email || "",
    isAnonymous,
    category: complaint.category,
    message: complaint.message,
    evidenceUrl: complaint.evidenceUrl || "",
    evidenceType: complaint.evidenceType || "",
    evidenceName: complaint.evidenceName || "",
    urgency: complaint.urgency || "",
    location: complaint.location || "",
    incidentTime: complaint.incidentTime || "",
    involvedPeople: complaint.involvedPeople || "",
    witnesses: complaint.witnesses || "",
    expectation: complaint.expectation || "",
    chatbotData: complaint.chatbotData || null,
    source: complaint.source || "",
    status: complaint.status,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
  };
};

const normalizeAccountRequest = (request) => ({
  id: request._id.toString(),
  name: request.name,
  username: request.username || request.email || "",
  className: request.className || "",
  contactPhone: request.contactPhone || "",
  studentCardUrl: request.studentCardUrl || "",
  studentCardType: request.studentCardType || "",
  studentCardName: request.studentCardName || "",
  status: request.status,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

module.exports = {
  normalizeUser,
  normalizeStudentAccount,
  normalizeComplaint,
  normalizeAccountRequest,
};
