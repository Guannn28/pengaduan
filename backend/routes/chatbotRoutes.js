const express = require("express");
const { auth } = require("../middleware/auth");
const { uploadEvidence } = require("../middleware/upload");
const { complaintCategories } = require("../constants");
const { createComplaint, findComplaintById } = require("../models/complaintModel");
const { parseObjectId } = require("../utils/objectId");
const { normalizeComplaint } = require("../utils/serializers");

const router = express.Router();

const categoryMap = {
  pembulian: "Kasus Pembulian",
  kekerasan: "Kekerasan",
  pelecehan: "Pelecehan",
  akademik: "Akademik",
  lainnya: "Lainnya",
};

const parseFinalData = (rawFinalData) => {
  if (!rawFinalData) {
    return null;
  }

  if (typeof rawFinalData === "object") {
    return rawFinalData;
  }

  if (typeof rawFinalData !== "string") {
    return null;
  }

  try {
    return JSON.parse(rawFinalData);
  } catch (_error) {
    return null;
  }
};

const parseN8nOutput = (output) => {
  if (output && typeof output === "object") {
    return output;
  }

  if (typeof output !== "string") {
    return null;
  }

  const cleaned = output
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    return null;
  }
};

router.post("/message", auth(["student"]), async (req, res) => {
  try {
    const { message, history } = req.body || {};
    const normalizedMessage =
      typeof message === "string" ? message.trim() : String(message || "").trim();

    if (!normalizedMessage) {
      return res.status(400).json({ error: "Message tidak boleh kosong." });
    }

    const webhookUrl = process.env.N8N_CHATBOT_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: "Webhook chatbot belum dikonfigurasi." });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: req.body.message,
        history: history || [],
        user: {
          id: req.user.id,
          name: req.user.name,
          username: req.user.username,
          className: req.user.className,
        },
      }),
    });

    const data = await response.json();
    const parsedOutput = parseN8nOutput(data?.output);
    if (!parsedOutput) {
      return res.status(500).json({ message: "Response chatbot tidak valid" });
    }

    return res.json({
      success: true,
      data: parsedOutput,
    });
  } catch (error) {
    console.error("Chatbot message error", error);
    return res.status(500).json({ message: "Response chatbot tidak valid" });
  }
});

router.post(
  "/submit",
  auth(["student"]),
  uploadEvidence.single("evidence"),
  async (req, res) => {
    try {
      const finalData = parseFinalData(req.body?.finalData);
      if (!finalData) {
        return res.status(400).json({ error: "finalData tidak valid." });
      }

      const rawCategory = String(finalData.kategori || "").trim().toLowerCase();
      const category = categoryMap[rawCategory];
      if (!category || !complaintCategories.includes(category)) {
        return res.status(400).json({ error: "Kategori tidak valid." });
      }

      const modeIdentitas = String(finalData.modeIdentitas || "").trim().toLowerCase();
      const urgency = String(finalData.urgensi || "").trim();
      const isAnonymous = modeIdentitas.includes("anonim");

      const kronologi = String(finalData.kronologi || "").trim();
      const lokasi = String(finalData.lokasi || "").trim();
      const waktu = String(finalData.waktu || "").trim();
      const pihakTerlibat = String(finalData.pihakTerlibat || "").trim();
      const saksi = String(finalData.saksi || "").trim();
      const bukti = String(finalData.bukti || "").trim();
      const harapan = String(finalData.harapan || "").trim();

      if (!kronologi || !lokasi || !waktu || !pihakTerlibat || !harapan) {
        return res.status(400).json({
          error: "Kronologi, lokasi, waktu, pihak terlibat, dan harapan wajib diisi.",
        });
      }

      const message = [
        `Kronologi: ${kronologi}`,
        `Lokasi: ${lokasi}`,
        `Waktu: ${waktu}`,
        `Pihak Terlibat: ${pihakTerlibat}`,
        `Saksi: ${saksi || "Tidak ada"}`,
        `Bukti Tambahan: ${bukti || "Tidak ada"}`,
        `Harapan Pelapor: ${harapan}`,
      ].join("\n");

      const now = new Date();
      const payload = {
        userId: parseObjectId(req.user.id),
        name: req.user.name,
        username: req.user.username,
        isAnonymous,
        category,
        message,
        urgency,
        location: lokasi,
        incidentTime: waktu,
        involvedPeople: pihakTerlibat,
        witnesses: saksi,
        expectation: harapan,
        chatbotData: finalData,
        source: "chatbot",
        status: "submitted",
        createdAt: now,
        updatedAt: now,
      };

      if (req.file) {
        payload.evidenceUrl = `/uploads/complaints/${req.file.filename}`;
        payload.evidenceType = req.file.mimetype;
        payload.evidenceName = req.file.originalname;
      }

      const result = await createComplaint(payload);
      const created = await findComplaintById(result.insertedId);

      return res.status(201).json({
        success: true,
        complaint: normalizeComplaint(created, { viewerRole: req.user.role }),
      });
    } catch (error) {
      console.error("Submit chatbot complaint error", error);
      return res.status(500).json({ error: "Gagal menyimpan pengaduan." });
    }
  }
);

module.exports = router;
