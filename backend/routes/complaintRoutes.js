const express = require("express");
const {
  createComplaintHandler,
  deleteComplaint,
  downloadComplaintEvidence,
  getStats,
  health,
  listComplaints,
  updateComplaintStatus,
} = require("../controllers/complaintController");
const { auth } = require("../middleware/auth");
const { uploadEvidence } = require("../middleware/upload");

const router = express.Router();

router.get("/health", health);
router.get("/complaints", auth(), listComplaints);
router.post(
  "/complaints",
  auth(["student", "admin"]),
  uploadEvidence.single("evidence"),
  createComplaintHandler
);
router.patch("/complaints/:id/status", auth(["admin"]), updateComplaintStatus);
router.get(
  "/complaints/:id/evidence/download",
  auth(["admin"]),
  downloadComplaintEvidence
);
router.delete("/complaints/:id", auth(["admin"]), deleteComplaint);
router.get("/stats", auth(["admin"]), getStats);

module.exports = router;
