const fs = require("fs");
const path = require("path");
const { complaintCategories, complaintStatuses } = require("../constants");
const { getDbState } = require("../config/db");
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

/**
 * Memeriksa status kesehatan server dan koneksi database.
 * Fungsi ini digunakan untuk keperluan monitoring infrastruktur backend.
 * @param {Object} _req - Objek request dari Express (tidak digunakan)
 * @param {Object} res - Objek response dari Express
 */
const health = async (_req, res) => {
  const dbState = getDbState();
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    database: dbState.connected ? "connected" : "disconnected",
    lastDatabaseError: dbState.lastError || null,
    lastDatabaseConnectedAt: dbState.lastConnectedAt || null,
  });
};

/**
 * Mengambil daftar pengaduan dari database.
 * Jika user adalah 'admin', maka seluruh pengaduan akan diambil.
 * Jika user adalah 'student', hanya pengaduan yang dibuat oleh siswa tersebut yang diambil.
 * Hasil diurutkan berdasarkan waktu pembuatan terbaru.
 * @param {Object} req - Objek request dari Express yang memuat informasi user
 * @param {Object} res - Objek response dari Express
 * @returns {Array} List data pengaduan yang sudah dinormalisasi
 */
const listComplaints = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { userId: parseObjectId(req.user.id) };
    const rows = await findComplaints(query, { sort: { createdAt: -1 } });
    return res.json(rows.map((row) => normalizeComplaint(row, { viewerRole: req.user.role })));
  } catch (err) {
    console.error("List complaints error", err);
    return res.status(500).json({ error: "Gagal mengambil pengaduan." });
  }
};

/**
 * Membuat data pengaduan baru ke dalam sistem.
 * Menerima payload teks (kategori, pesan, status anonim) serta file bukti (foto/video).
 * File bukti diproses melalui middleware upload multer dan jalurnya disimpan ke database.
 * @param {Object} req - Objek request dari Express yang memuat form-data dan info file
 * @param {Object} res - Objek response dari Express
 * @returns {Object} Data pengaduan baru yang berhasil disimpan
 */
const createComplaintHandler = async (req, res) => {
  try {
    const { category, message, isAnonymous } = req.body || {};

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

    const normalizedAnonymous =
      String(isAnonymous).trim().toLowerCase() === "true" ||
      String(isAnonymous).trim() === "1";

    const now = new Date();
    const result = await createComplaint({
      userId: parseObjectId(req.user.id),
      name: req.user.name,
      username: req.user.username,
      isAnonymous: normalizedAnonymous,
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
    return res.status(201).json(normalizeComplaint(created, { viewerRole: req.user.role }));
  } catch (err) {
    console.error("Create complaint error", err);
    return res.status(500).json({ error: "Gagal membuat pengaduan." });
  }
};

/**
 * Memperbarui status dari sebuah pengaduan. (Dikhususkan untuk Admin)
 * Transisi status yang diizinkan meliputi: 'submitted' (Menunggu), 'in_progress' (Diproses), 
 * 'resolved' (Selesai), atau 'rejected' (Ditolak).
 * Fungsi ini memastikan bahwa status yang dikirim valid sebelum mengupdate database.
 * @param {Object} req - Objek request dari Express (memuat param ID dan body status baru)
 * @param {Object} res - Objek response dari Express
 * @returns {Object} Data pengaduan setelah statusnya diperbarui
 */
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    // Validasi apakah status yang dikirim ada di dalam daftar status yang diizinkan
    if (!complaintStatuses.includes(status)) {
      return res.status(400).json({ error: "Status tidak valid. Transisi dibatalkan." });
    }

    const objectId = parseObjectId(id);
    const existing = objectId ? await findComplaintById(objectId) : null;
    
    // Verifikasi keberadaan data pengaduan
    if (!existing) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan." });
    }

    // Eksekusi update status ke database dan catat waktu pembaruannya (updatedAt)
    await updateComplaintById(objectId, {
      $set: { status, updatedAt: new Date() },
    });

    const updated = await findComplaintById(objectId);
    return res.json(normalizeComplaint(updated, { viewerRole: req.user.role }));
  } catch (err) {
    console.error("Update status error", err);
    return res.status(500).json({ error: "Gagal memperbarui status pengaduan." });
  }
};

/**
 * Menyediakan endpoint untuk mengunduh file bukti (evidence) yang terkait dengan suatu pengaduan.
 * Melakukan resolusi path lokal secara aman untuk mencegah path traversal vulnerability.
 * @param {Object} req - Objek request dari Express (memuat param ID pengaduan)
 * @param {Object} res - Objek response dari Express untuk transmisi file
 */
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

/**
 * Menghapus data pengaduan beserta file bukti lokal yang dilampirkan. (Hanya untuk Admin/Owner)
 * Fungsi ini memastikan tidak ada "file yatim" (orphan files) yang tertinggal di server
 * dengan memanggil fungsi removeLocalEvidence().
 * @param {Object} req - Objek request dari Express (memuat param ID pengaduan)
 * @param {Object} res - Objek response dari Express (konfirmasi sukes)
 */
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

/**
 * Mengambil ringkasan statistik dari total pengaduan berdasarkan statusnya.
 * Data ini digunakan untuk menampilkan insight di Admin Dashboard.
 * @param {Object} _req - Objek request dari Express
 * @param {Object} res - Objek response dari Express
 * @returns {Object} Data agregat total aduan per status dan list 5 aduan terbaru
 */
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
      latest: latestRows.map((row) => normalizeComplaint(row, { viewerRole: "admin" })),
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
