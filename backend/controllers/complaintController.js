const fs = require("fs");
const path = require("path");
const { complaintCategories, complaintStatuses } = require("../config/constants");
const {
  aggregateComplaintCounts,
  createComplaint,
  deleteComplaintById,
  findComplaintById,
  findComplaints,
  updateComplaintById,
} = require("../models/complaintModel");
const { parseObjectId } = require("../utils/objectId");
const { normalizeComplaint } = require("../utils/serializers");
const { getLocalEvidencePath, removeLocalEvidence } = require("../utils/fileStorage");

const health = async (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
};

const listComplaints = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { userId: parseObjectId(req.user.id) };
    const rows = await findComplaints(query, { sort: { createdAt: -1 } });
    return res.json(rows.map(normalizeComplaint));
  } catch (err) {
    console.error("List complaints error", err);
    return res.status(500).json({ error: "Gagal mengambil pengaduan." });
  }
};

const createComplaintHandler = async (req, res) => {
  try {
    const { category, message } = req.body || {};

    if (!category || !message) {
      return res.status(400).json({ error: "Kategori dan pesan wajib diisi." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Bukti foto atau video wajib diunggah." });
    }

    const normalizedCategory = String(category).trim();
    if (!complaintCategories.includes(normalizedCategory)) {
      return res.status(400).json({ error: "Kategori tidak valid." });
    }

    const now = new Date();
    const result = await createComplaint({
      userId: parseObjectId(req.user.id),
      name: req.user.name,
      email: req.user.email,
      category: normalizedCategory,
      message: String(message).trim(),
      evidenceUrl: `/uploads/complaints/${req.file.filename}`,
      evidenceType: req.file.mimetype,
      evidenceName: req.file.originalname,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    });

    const created = await findComplaintById(result.insertedId);
    return res.status(201).json(normalizeComplaint(created));
  } catch (err) {
    console.error("Create complaint error", err);
    return res.status(500).json({ error: "Gagal membuat pengaduan." });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!complaintStatuses.includes(status)) {
      return res.status(400).json({ error: "Status tidak valid." });
    }

    const objectId = parseObjectId(id);
    const existing = objectId ? await findComplaintById(objectId) : null;
    if (!existing) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan." });
    }

    await updateComplaintById(objectId, {
      $set: { status, updatedAt: new Date() },
    });

    const updated = await findComplaintById(objectId);
    return res.json(normalizeComplaint(updated));
  } catch (err) {
    console.error("Update status error", err);
    return res.status(500).json({ error: "Gagal memperbarui status." });
  }
};

const downloadComplaintEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = parseObjectId(id);
    const complaint = objectId ? await findComplaintById(objectId) : null;

    if (!complaint) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan." });
    }

    if (!complaint.evidenceUrl) {
      return res.status(404).json({ error: "File bukti tidak tersedia." });
    }

    const evidencePath = getLocalEvidencePath(complaint.evidenceUrl);
    if (!evidencePath || !fs.existsSync(evidencePath)) {
      return res.status(404).json({ error: "File bukti tidak ditemukan di server." });
    }

    return res.download(evidencePath, complaint.evidenceName || path.basename(evidencePath));
  } catch (err) {
    console.error("Download evidence error", err);
    return res.status(500).json({ error: "Gagal mengunduh file bukti." });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = parseObjectId(id);
    const existing = objectId ? await findComplaintById(objectId) : null;

    if (!existing) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan." });
    }

    await deleteComplaintById(objectId);
    removeLocalEvidence(existing.evidenceUrl);
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete complaint error", err);
    return res.status(500).json({ error: "Gagal menghapus pengaduan." });
  }
};

const getStats = async (_req, res) => {
  try {
    const countsRows = await aggregateComplaintCounts();
    const counts = countsRows.reduce((acc, row) => {
      acc[row._id] = row.total;
      return acc;
    }, {});

    const latestRows = await findComplaints({}, { sort: { createdAt: -1 }, limit: 5 });
    return res.json({
      counts,
      latest: latestRows.map(normalizeComplaint),
    });
  } catch (err) {
    console.error("Stats error", err);
    return res.status(500).json({ error: "Gagal mengambil statistik." });
  }
};

module.exports = {
  health,
  listComplaints,
  createComplaintHandler,
  updateComplaintStatus,
  downloadComplaintEvidence,
  deleteComplaint,
  getStats,
};
