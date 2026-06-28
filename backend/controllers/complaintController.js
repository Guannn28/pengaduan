const fs = require("fs");
const ExcelJS = require("exceljs");
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
const { findUsersByIds } = require("../models/userModel");
const { parseObjectId } = require("../utils/objectId");
const { normalizeComplaint } = require("../utils/serializers");
const { getLocalEvidencePath, removeLocalEvidence } = require("../utils/fileStorage");
const {
  cloudinaryFolders,
  deleteCloudinaryAsset,
  uploadBufferToCloudinary,
} = require("../utils/cloudinary");

const isRemoteUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const isCloudinaryUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch (_error) {
    return false;
  }
};

const getSafeDownloadName = (value) =>
  path.basename(String(value || "bukti-pengaduan")).replace(/[\r\n"]/g, "_") ||
  "bukti-pengaduan";

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

    const uploadedEvidence = await uploadBufferToCloudinary(
      req.file,
      cloudinaryFolders.complaintEvidence
    );

    const now = new Date();
    const result = await createComplaint({
      userId: parseObjectId(req.user.id),
      name: req.user.name,
      username: req.user.username,
      isAnonymous: normalizedAnonymous,
      category: normalizedCategory,
      message: String(message).trim(),
      evidenceUrl: uploadedEvidence.secureUrl,
      evidencePublicId: uploadedEvidence.publicId,
      evidenceResourceType: uploadedEvidence.resourceType,
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
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!complaintStatuses.includes(status)) {
      return res.status(400).json({ error: "Status tidak valid. Transisi dibatalkan." });
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
    return res.json(normalizeComplaint(updated, { viewerRole: req.user.role }));
  } catch (err) {
    console.error("Update status error", err);
    return res.status(500).json({ error: "Gagal memperbarui status pengaduan." });
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

    if (isRemoteUrl(complaint.evidenceUrl)) {
      if (!isCloudinaryUrl(complaint.evidenceUrl)) {
        return res.status(400).json({ error: "URL bukti bukan URL Cloudinary yang valid." });
      }

      const response = await fetch(complaint.evidenceUrl);
      if (!response.ok) {
        return res.status(404).json({ error: "File bukti tidak ditemukan di Cloudinary." });
      }

      const contentType = response.headers.get("content-type");
      const buffer = Buffer.from(await response.arrayBuffer());
      res.attachment(getSafeDownloadName(complaint.evidenceName));
      if (contentType) {
        res.type(contentType);
      }
      return res.send(buffer);
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
    if (existing.evidencePublicId) {
      try {
        await deleteCloudinaryAsset(existing.evidencePublicId, existing.evidenceResourceType);
      } catch (cloudinaryError) {
        console.warn("Delete Cloudinary evidence warning", cloudinaryError.message);
      }
    }
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
      latest: latestRows.map((row) => normalizeComplaint(row, { viewerRole: "admin" })),
    });
  } catch (err) {
    console.error("Stats error", err);
    return res.status(500).json({ error: "Gagal mengambil statistik." });
  }
};

const exportStatusLabels = {
  submitted: "Diajukan",
  in_progress: "Diproses",
  resolved: "Selesai",
  rejected: "Ditolak",
};

const safeCellValue = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }

  const normalized = String(value).trim();
  return normalized || "-";
};

const formatExportDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatEvidenceValue = (complaint) => {
  const evidenceName = safeCellValue(complaint.evidenceName);
  const evidenceUrl = safeCellValue(complaint.evidenceUrl);

  if (evidenceName === "-" && evidenceUrl === "-") {
    return "-";
  }

  if (evidenceName !== "-" && evidenceUrl !== "-") {
    return `${evidenceName} (${evidenceUrl})`;
  }

  return evidenceName !== "-" ? evidenceName : evidenceUrl;
};

const exportComplaintsToExcel = async (_req, res) => {
  try {
    const rows = await findComplaints({}, { sort: { createdAt: -1 } });
    const reporterIds = rows.map((complaint) => complaint.userId).filter(Boolean);
    const reporters = await findUsersByIds(reporterIds);
    const reportersById = new Map(
      reporters.map((reporter) => [reporter._id.toString(), reporter])
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Pengaduan Siswa";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Pengaduan Siswa");

    sheet.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "Nama Pelapor", key: "reporterName", width: 24 },
      { header: "Username/Email Pelapor", key: "reporterUsername", width: 28 },
      { header: "Kelas", key: "className", width: 16 },
      { header: "Kategori Pengaduan", key: "category", width: 28 },
      { header: "Isi Pengaduan", key: "message", width: 56 },
      { header: "Status Anonim", key: "anonymousStatus", width: 16 },
      { header: "Status Penanganan", key: "handlingStatus", width: 18 },
      { header: "Bukti Pengaduan", key: "evidence", width: 42 },
      { header: "Tanggal Pengaduan", key: "createdAt", width: 22 },
      { header: "Tanggal Update", key: "updatedAt", width: 22 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0D1B2A" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    headerRow.height = 24;

    rows.forEach((complaint, index) => {
      const reporter = complaint.userId
        ? reportersById.get(complaint.userId.toString())
        : null;
      const isAnonymous = Boolean(complaint.isAnonymous);
      const reporterName = isAnonymous
        ? "Anonim"
        : safeCellValue(complaint.name || reporter?.name);
      const reporterUsername = isAnonymous
        ? "-"
        : safeCellValue(
            complaint.username ||
              complaint.email ||
              reporter?.username ||
              reporter?.email
          );
      const reporterClass = isAnonymous
        ? "-"
        : safeCellValue(complaint.className || reporter?.className);

      sheet.addRow({
        no: index + 1,
        reporterName,
        reporterUsername,
        className: reporterClass,
        category: safeCellValue(complaint.category),
        message: safeCellValue(complaint.message),
        anonymousStatus: isAnonymous ? "Ya" : "Tidak",
        handlingStatus: exportStatusLabels[complaint.status] || safeCellValue(complaint.status),
        evidence: formatEvidenceValue(complaint),
        createdAt: formatExportDate(complaint.createdAt),
        updatedAt: formatExportDate(complaint.updatedAt),
      });
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = {
      from: "A1",
      to: "K1",
    };
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="data-pengaduan.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export complaints to Excel error", err);
    return res.status(500).json({ error: "Gagal mengekspor data pengaduan." });
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
  exportComplaintsToExcel,
};
