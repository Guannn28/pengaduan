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

    // Logging: URL webhook dan Payload yang dikirim
    console.log(`[Chatbot Info] Mengirim request ke webhook n8n: ${n8nUrl}`);
    console.log(`[Chatbot Info] Payload yang dikirim: ${JSON.stringify(payload)}`);

    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Logging: Status code dari n8n
    console.log(`[Chatbot Info] Status code response dari n8n: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[Chatbot Error] Request gagal dengan status ${n8nResponse.status}. Response: ${errorText}`);
      throw new Error(`n8n webhook merespons dengan status: ${n8nResponse.status}`);
    }

    const rawText = await n8nResponse.text();
    let responseData;
    try {
      // Bersihkan string jika terbungkus kutip string mentah berlebih
      let cleanedText = rawText.trim();
      if (cleanedText.startsWith("'") && cleanedText.endsWith("'")) {
        cleanedText = cleanedText.slice(1, -1);
      }
      let parsed = JSON.parse(cleanedText);
      
      // n8n terkadang membungkus JSON sebenarnya di dalam properti "output" sebagai string
      if (parsed.output && typeof parsed.output === "string") {
        responseData = JSON.parse(parsed.output);
      } else {
        responseData = parsed;
      }
    } catch (e) {
      console.error("[Chatbot Error] Gagal parse JSON dari n8n. Teks mentah:", rawText);
      return res.status(500).json({ message: "Maaf, format data dari asisten AI sedang bermasalah." });
    }

    // Debugging Log sesuai permintaan
    console.log("[Chatbot Debug] Data dari n8n:", responseData);

    // Jika status completed, otomatis panggil fungsi penyimpanan pengaduan
    if (responseData.status === "completed" && responseData.data) {
      try {
        const finalData = responseData.data;
        const rawCategory = String(finalData.kategori || "").trim().toLowerCase().replace(/\s+/g, "_");
        const category = categoryMap[rawCategory] || categoryMap["lainnya"];
        console.log(`[Chatbot Debug] Kategori mentah: '${finalData.kategori}' -> normalized: '${rawCategory}' -> mapped: '${category}'`);

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

        // Jika frontend mengirim data bukti yang sudah diupload, lampirkan
        if (evidenceData && evidenceData.evidenceUrl) {
          payloadComplaint.evidenceUrl = evidenceData.evidenceUrl;
          payloadComplaint.evidenceType = evidenceData.evidenceType || "image/jpeg";
          payloadComplaint.evidenceName = evidenceData.evidenceName || "bukti.jpg";
          console.log("[Chatbot Info] Menyertakan bukti dari upload:", evidenceData);
        }

        const result = await createComplaint(payloadComplaint);
        const created = await findComplaintById(result.insertedId);
        
        // Opsional: Lampirkan data pengaduan yang berhasil dibuat ke dalam respons
        responseData.complaint = normalizeComplaint(created, { viewerRole: req.user.role });
        console.log("[Chatbot Info] Pengaduan berhasil disimpan secara otomatis dengan ID:", result.insertedId);
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

// Endpoint upload bukti selama sesi chat (sebelum laporan di-submit)
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

      console.log("[Chatbot Info] Bukti berhasil diupload:", fileData);
      return res.status(200).json({ success: true, file: fileData });
    } catch (error) {
      console.error("[Chatbot Error] Upload evidence error:", error);
      return res.status(500).json({ error: "Gagal mengupload bukti." });
    }
  }
);

module.exports = router;
