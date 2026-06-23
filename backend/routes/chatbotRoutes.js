const express = require("express");
const { auth } = require("../middleware/auth");
const { uploadEvidence } = require("../middleware/upload");
const { complaintCategories } = require("../constants");
const { createComplaint, findComplaintById } = require("../models/complaintModel");
const { parseObjectId } = require("../utils/objectId");
const { normalizeComplaint } = require("../utils/serializers");

const router = express.Router();

const categoryMap = {
  perundungan_bullying: "Perundungan & Bullying",
  kekerasan_fisik: "Kekerasan Fisik",
  kekerasan_verbal: "Kekerasan Verbal",
  pelecehan_seksual: "Pelecehan Seksual",
  pelecehan_non_seksual: "Pelecehan Non-Seksual",
  masalah_akademik: "Masalah Akademik",
  diskriminasi: "Diskriminasi",
  pelanggaran_privasi: "Pelanggaran Privasi",
  fasilitas_keamanan: "Fasilitas & Keamanan",
  lainnya: "Lainnya",
};

const parseFinalData = (rawFinalData) => {
  if (!rawFinalData) return null;
  if (typeof rawFinalData === "object") return rawFinalData;
  if (typeof rawFinalData !== "string") return null;
  try {
    return JSON.parse(rawFinalData);
  } catch (_error) {
    return null;
  }
};

router.post("/message", auth(["student"]), async (req, res) => {
  try {
    const { message, history, evidenceData } = req.body || {};
    const normalizedMessage =
      typeof message === "string" ? message.trim() : String(message || "").trim();

    if (!normalizedMessage) {
      return res.status(400).json({ error: "Message tidak boleh kosong." });
    }

    const n8nUrl = process.env.N8N_CHATBOT_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error("[Chatbot Error] N8N_CHATBOT_WEBHOOK_URL tidak dikonfigurasi di environment variables.");
      return res.status(500).json({ message: "Konfigurasi webhook chatbot tidak ditemukan" });
    }

    const payload = {
      message: normalizedMessage,
      history: history || [],
    };

    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      console.error(`[Chatbot Error] Request gagal dengan status ${n8nResponse.status}.`);
      throw new Error(`n8n webhook merespons dengan status: ${n8nResponse.status}`);
    }

    const rawText = await n8nResponse.text();
    let responseData;
    try {
      let cleanedText = rawText.trim();
      if (cleanedText.startsWith("'") && cleanedText.endsWith("'")) {
        cleanedText = cleanedText.slice(1, -1);
      }
      let parsed = JSON.parse(cleanedText);
      
      if (parsed.output && typeof parsed.output === "string") {
        responseData = JSON.parse(parsed.output);
      } else {
        responseData = parsed;
      }
    } catch (e) {
      console.error("[Chatbot Error] Gagal parse JSON dari n8n.");
      return res.status(500).json({ message: "Maaf, format data dari asisten AI sedang bermasalah." });
    }

    if (responseData.status === "completed" && responseData.data) {
      try {
        const finalData = responseData.data;
        const rawCategory = String(finalData.kategori || "").trim().toLowerCase().replace(/\s+/g, "_");
        const category = categoryMap[rawCategory] || categoryMap["lainnya"];

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

        const messageDesc = [
          `Kronologi: ${kronologi}`,
          `Lokasi: ${lokasi}`,
          `Waktu: ${waktu}`,
          `Pihak Terlibat: ${pihakTerlibat}`,
          `Saksi: ${saksi || "Tidak ada"}`,
          `Bukti Tambahan: ${bukti || "Tidak ada"}`,
          `Harapan Pelapor: ${harapan}`,
        ].join("\n");

        const now = new Date();
        const payloadComplaint = {
          userId: parseObjectId(req.user.id),
          name: req.user.name,
          username: req.user.username,
          isAnonymous,
          category,
          message: messageDesc,
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

        if (evidenceData && evidenceData.evidenceUrl) {
          payloadComplaint.evidenceUrl = evidenceData.evidenceUrl;
          payloadComplaint.evidenceType = evidenceData.evidenceType || "image/jpeg";
          payloadComplaint.evidenceName = evidenceData.evidenceName || "bukti.jpg";
        }

        const result = await createComplaint(payloadComplaint);
        const created = await findComplaintById(result.insertedId);
        
        responseData.complaint = normalizeComplaint(created, { viewerRole: req.user.role });
      } catch (err) {
        console.error("[Chatbot Error] Gagal menyimpan otomatis pengaduan:", err);
      }
    }

    return res.status(200).json({ message: responseData.reply });
  } catch (error) {
    console.error("[Chatbot Error] Message processing error:", error.message || error);
    return res.status(500).json({ message: "Response chatbot gagal diproses" });
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

      const rawCategory = String(finalData.kategori || "").trim().toLowerCase().replace(/\s+/g, "_");
      const category = categoryMap[rawCategory] || categoryMap["lainnya"];

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

      if (!kronologi) {
        return res.status(400).json({
          error: "Kronologi kejadian wajib diisi.",
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

router.post(
  "/upload-evidence",
  auth(["student"]),
  uploadEvidence.single("evidence"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File tidak ditemukan." });
      }

      const fileData = {
        evidenceUrl: `/uploads/complaints/${req.file.filename}`,
        evidenceType: req.file.mimetype,
        evidenceName: req.file.originalname,
      };

      return res.status(200).json({ success: true, file: fileData });
    } catch (error) {
      console.error("[Chatbot Error] Upload evidence error:", error);
      return res.status(500).json({ error: "Gagal mengupload bukti." });
    }
  }
);

module.exports = router;
