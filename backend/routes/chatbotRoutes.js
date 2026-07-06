const express = require("express");
const { auth } = require("../middleware/auth");
const { uploadEvidence } = require("../middleware/upload");
const env = require("../config/env");
const { createComplaint, findComplaintById } = require("../models/complaintModel");
const {
  deleteActiveChatbotDraft,
  findActiveChatbotDraft,
  upsertChatbotDraftEvidence,
} = require("../models/chatbotDraftModel");
const { parseObjectId } = require("../utils/objectId");
const { normalizeComplaint } = require("../utils/serializers");
const {
  cloudinaryFolders,
  deleteCloudinaryAsset,
  uploadBufferToCloudinary,
} = require("../utils/cloudinary");

const router = express.Router();

const CHATBOT_FALLBACK_MESSAGE = "Layanan asisten sedang sibuk, silakan coba beberapa saat lagi.";
const CHATBOT_CONNECTION_MESSAGE = "Koneksi ke asisten gagal. Periksa koneksi internet lalu coba lagi.";
const CHATBOT_INVALID_RESPONSE_MESSAGE = "Format respons asisten tidak sesuai. Silakan coba lagi.";
const DEFAULT_N8N_TIMEOUT_MS = 45000;

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

const getN8nTimeoutMs = () => {
  const value = Number(env.N8N_CHATBOT_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_N8N_TIMEOUT_MS;
};

const createChatbotError = (code, message, cause) => {
  const error = new Error(message);
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
};

const parseJsonLikePayload = (value) => {
  if (value === null || value === undefined) {
    throw createChatbotError("CHATBOT_INVALID_RESPONSE", CHATBOT_INVALID_RESPONSE_MESSAGE);
  }

  if (typeof value !== "string") {
    return value;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    throw createChatbotError("CHATBOT_INVALID_RESPONSE", CHATBOT_INVALID_RESPONSE_MESSAGE);
  }

  const unwrapped =
    cleaned.startsWith("'") && cleaned.endsWith("'")
      ? cleaned.slice(1, -1)
      : cleaned;

  try {
    return JSON.parse(unwrapped);
  } catch (_error) {
    return { reply: unwrapped };
  }
};

const TEXT_FIELDS = ["output", "message", "reply", "response", "text"];

const extractTextField = (obj) => {
  for (const key of TEXT_FIELDS) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return { key, value: obj[key] };
    }
  }
  return null;
};

const normalizeN8nResponse = (payload) => {
  // Handle arrays: N8N often returns [{ output: "..." }] or [{ json: { ... } }]
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      throw createChatbotError("CHATBOT_INVALID_RESPONSE", CHATBOT_INVALID_RESPONSE_MESSAGE);
    }
    return normalizeN8nResponse(payload[0]);
  }

  // Handle raw strings (may be JSON or plain text)
  if (typeof payload === "string") {
    return normalizeN8nResponse(parseJsonLikePayload(payload));
  }

  if (!payload || typeof payload !== "object") {
    throw createChatbotError("CHATBOT_INVALID_RESPONSE", CHATBOT_INVALID_RESPONSE_MESSAGE);
  }

  // Handle N8N's common { json: { ... } } wrapper
  if (payload.json !== undefined && typeof payload.json === "object" && payload.json !== null) {
    return normalizeN8nResponse(payload.json);
  }

  // Try to find a known text field whose value is a stringified JSON or plain text
  const found = extractTextField(payload);
  if (found) {
    const parsed = parseJsonLikePayload(found.value);
    // If parsing produced a non-trivial object (not just { reply: sameString }),
    // recurse to normalise it further. Otherwise keep current payload.
    if (typeof parsed === "object" && parsed !== null) {
      const isPassthrough =
        Object.keys(parsed).length === 1 &&
        parsed.reply === String(found.value);
      if (!isPassthrough) {
        return normalizeN8nResponse(parsed);
      }
    }
  }

  return payload;
};

const parseN8nResponseText = (rawText) => normalizeN8nResponse(parseJsonLikePayload(rawText));

const getAssistantReply = (responseData) => {
  // Check all known text fields
  for (const key of TEXT_FIELDS) {
    const val = responseData?.[key];
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }

  if (responseData?.status === "completed" && responseData?.data) {
    return "Laporan sudah tersusun. Silakan periksa ringkasan sebelum dikirim.";
  }

  // Last resort: if the object has any string value at all, use it
  if (responseData && typeof responseData === "object") {
    for (const val of Object.values(responseData)) {
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
    }
  }

  throw createChatbotError("CHATBOT_INVALID_RESPONSE", CHATBOT_INVALID_RESPONSE_MESSAGE);
};

const fetchN8nWebhook = async (n8nUrl, payload) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getN8nTimeoutMs());

  try {
    return await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createChatbotError("CHATBOT_TIMEOUT", CHATBOT_FALLBACK_MESSAGE, error);
    }

    throw createChatbotError("CHATBOT_NETWORK", CHATBOT_CONNECTION_MESSAGE, error);
  } finally {
    clearTimeout(timeoutId);
  }
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

const parseHistoryPayload = (rawHistory) => {
  if (Array.isArray(rawHistory)) {
    return rawHistory;
  }

  if (typeof rawHistory !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(rawHistory);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const getRequestUserId = (req) => parseObjectId(req.user.id);

const logEvidenceFileDiagnostic = (routeName, file) => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("[chatbot evidence]", {
    route: routeName,
    hasFile: Boolean(file),
    fieldname: file?.fieldname,
    originalname: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size,
  });
};

const logCloudinaryEvidenceDiagnostic = (routeName, uploadedEvidence) => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("[chatbot evidence cloudinary]", {
    route: routeName,
    hasSecureUrl: Boolean(uploadedEvidence?.secureUrl),
    publicId: uploadedEvidence?.publicId,
    resourceType: uploadedEvidence?.resourceType,
  });
};

const getDraftDocument = (draft) => {
  if (!draft) {
    return null;
  }

  return draft.value || draft;
};

const normalizeDraftEvidence = (draft) => {
  const draftDocument = getDraftDocument(draft);
  const evidenceSource = draftDocument?.evidence || draftDocument;

  if (!evidenceSource?.evidenceUrl && !evidenceSource?.url) {
    return null;
  }

  return {
    evidenceUrl: evidenceSource.evidenceUrl || evidenceSource.url || "",
    evidencePublicId: evidenceSource.evidencePublicId || evidenceSource.publicId || "",
    evidenceResourceType:
      evidenceSource.evidenceResourceType || evidenceSource.resourceType || "",
    evidenceMimeType:
      evidenceSource.evidenceMimeType ||
      evidenceSource.evidenceType ||
      evidenceSource.mimeType ||
      "",
    evidenceType:
      evidenceSource.evidenceType ||
      evidenceSource.evidenceMimeType ||
      evidenceSource.mimeType ||
      "",
    evidenceName: evidenceSource.evidenceName || evidenceSource.name || "",
    evidenceSize: evidenceSource.evidenceSize || evidenceSource.size || 0,
  };
};

const buildUploadedEvidenceData = (file, uploadedEvidence) => ({
  evidenceUrl: uploadedEvidence.secureUrl,
  evidencePublicId: uploadedEvidence.publicId,
  evidenceResourceType: uploadedEvidence.resourceType,
  evidenceMimeType: file.mimetype,
  evidenceType: file.mimetype,
  evidenceName: file.originalname,
  evidenceSize: file.size || 0,
});

const replaceDraftEvidence = async (userId, file) => {
  const existingDraft = await findActiveChatbotDraft(userId);
  let uploadedEvidence;

  try {
    uploadedEvidence = await uploadBufferToCloudinary(
      file,
      cloudinaryFolders.complaintEvidence
    );
    logCloudinaryEvidenceDiagnostic("draft-replace", uploadedEvidence);

    const evidenceData = buildUploadedEvidenceData(file, uploadedEvidence);
    const updatedDraft = await upsertChatbotDraftEvidence(userId, evidenceData);
    const previousEvidence = normalizeDraftEvidence(existingDraft);

    if (
      previousEvidence?.evidencePublicId &&
      previousEvidence.evidencePublicId !== evidenceData.evidencePublicId
    ) {
      try {
        await deleteCloudinaryAsset(
          previousEvidence.evidencePublicId,
          previousEvidence.evidenceResourceType
        );
      } catch (cloudinaryError) {
        console.warn("Delete replaced chatbot evidence warning", cloudinaryError.message);
      }
    }

    return updatedDraft;
  } catch (error) {
    if (uploadedEvidence?.publicId) {
      try {
        await deleteCloudinaryAsset(uploadedEvidence.publicId, uploadedEvidence.resourceType);
      } catch (cloudinaryError) {
        console.warn("Cleanup failed chatbot evidence upload warning", cloudinaryError.message);
      }
    }

    throw error;
  }
};

const deleteDraftAndEvidence = async (userId) => {
  const existingDraft = await findActiveChatbotDraft(userId);
  await deleteActiveChatbotDraft(userId);

  const evidence = normalizeDraftEvidence(existingDraft);
  if (evidence?.evidencePublicId) {
    try {
      await deleteCloudinaryAsset(evidence.evidencePublicId, evidence.evidenceResourceType);
    } catch (cloudinaryError) {
      console.warn("Delete chatbot draft evidence warning", cloudinaryError.message);
    }
  }
};

const buildComplaintPayload = (user, userId, finalData, draft) => {
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
    userId,
    name: user.name,
    username: user.username,
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

  const evidence = normalizeDraftEvidence(draft);
  if (evidence) {
    payload.evidenceUrl = evidence.evidenceUrl;
    payload.evidencePublicId = evidence.evidencePublicId;
    payload.evidenceResourceType = evidence.evidenceResourceType;
    payload.evidenceMimeType = evidence.evidenceMimeType;
    payload.evidenceType = evidence.evidenceMimeType;
    payload.evidenceName = evidence.evidenceName;
    payload.evidenceSize = evidence.evidenceSize;
  }

  return payload;
};

const createComplaintFromChatbotData = async (req, finalData, draft) => {
  const userId = getRequestUserId(req);
  const result = await createComplaint(
    buildComplaintPayload(req.user, userId, finalData, draft)
  );
  const created = await findComplaintById(result.insertedId);
  await deleteActiveChatbotDraft(userId);

  return normalizeComplaint(created, { viewerRole: req.user.role });
};

router.get("/draft", auth(["student"]), async (req, res) => {
  try {
    const draft = await findActiveChatbotDraft(getRequestUserId(req));
    return res.status(200).json({
      success: true,
      draft: normalizeDraftEvidence(draft),
    });
  } catch (error) {
    console.error("[Chatbot Error] Get draft error:", error);
    return res.status(500).json({ error: "Gagal mengambil draft chatbot." });
  }
});

router.post("/message", auth(["student"]), uploadEvidence.single("evidence"), async (req, res) => {
  try {
    logEvidenceFileDiagnostic("/message", req.file);
    const { message, history } = req.body || {};
    const normalizedMessage =
      typeof message === "string" ? message.trim() : String(message || "").trim();

    if (!normalizedMessage) {
      return res.status(400).json({ error: "Message tidak boleh kosong." });
    }

    const userId = getRequestUserId(req);

    // --- TRACE: fetch draft BEFORE processing ---
    const draftBeforeMessage = await findActiveChatbotDraft(userId);
    console.log("[DRAFT EVIDENCE BEFORE MESSAGE]", {
      userId: userId?.toString(),
      conversationId: "default",
      hasFile: Boolean(req.file),
      draftFound: Boolean(draftBeforeMessage),
      evidenceUrl: draftBeforeMessage?.evidenceUrl || null,
      evidencePublicId: draftBeforeMessage?.evidencePublicId || null,
    });

    let activeDraft = req.file
      ? await replaceDraftEvidence(userId, req.file)
      : draftBeforeMessage;

    const n8nUrl = env.N8N_CHATBOT_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error("[Chatbot Error] N8N_CHATBOT_WEBHOOK_URL tidak dikonfigurasi di environment variables.");
      return res.status(503).json({ success: false, message: CHATBOT_FALLBACK_MESSAGE });
    }

    const payload = {
      message: normalizedMessage,
      history: parseHistoryPayload(history),
    };

    const n8nResponse = await fetchN8nWebhook(n8nUrl, payload);

    if (!n8nResponse.ok) {
      console.error(`[Chatbot Error] Request gagal dengan status ${n8nResponse.status}.`);
      throw createChatbotError("CHATBOT_UPSTREAM_HTTP", CHATBOT_FALLBACK_MESSAGE);
    }

    const rawText = await n8nResponse.text();
    const responseData = parseN8nResponseText(rawText);
    const finalData =
      responseData.status === "completed" ? parseFinalData(responseData.data) : null;
    if (finalData) {
      responseData.data = finalData;
    }
    const assistantReply = getAssistantReply(responseData);
    let createdComplaint = null;

    if (responseData.status === "completed" && finalData) {
      try {
        activeDraft = activeDraft || await findActiveChatbotDraft(userId);
        createdComplaint = await createComplaintFromChatbotData(req, finalData, activeDraft);
        activeDraft = null;
      } catch (err) {
        console.error("[Chatbot Error] Gagal menyimpan otomatis pengaduan:", err);
      }
    }

    // --- TRACE: log draft state AFTER processing ---
    const normalizedDraftEvidence = normalizeDraftEvidence(activeDraft);
    console.log("[DRAFT EVIDENCE AFTER MESSAGE]", {
      userId: userId?.toString(),
      conversationId: "default",
      hasFile: Boolean(req.file),
      activeDraftFound: Boolean(activeDraft),
      activeDraftEvidenceUrl: activeDraft?.evidenceUrl || activeDraft?.value?.evidenceUrl || null,
      normalizedDraftEvidenceUrl: normalizedDraftEvidence?.evidenceUrl || null,
      normalizedDraftPublicId: normalizedDraftEvidence?.evidencePublicId || null,
    });

    return res.status(200).json({
      success: true,
      message: assistantReply,
      status: responseData.status || "",
      data: responseData.data || null,
      complaint: createdComplaint,
      draft: normalizedDraftEvidence,
    });
  } catch (error) {
    console.error("[Chatbot Error] Message processing error:", error.code || error.message || error);

    if (error.code === "CHATBOT_TIMEOUT") {
      return res.status(504).json({ success: false, message: CHATBOT_FALLBACK_MESSAGE });
    }

    if (error.code === "CHATBOT_NETWORK") {
      return res.status(502).json({ success: false, message: CHATBOT_CONNECTION_MESSAGE });
    }

    if (error.code === "CHATBOT_INVALID_RESPONSE") {
      return res.status(502).json({ success: false, message: CHATBOT_INVALID_RESPONSE_MESSAGE });
    }

    if (error.code === "CHATBOT_UPSTREAM_HTTP") {
      return res.status(502).json({ success: false, message: CHATBOT_FALLBACK_MESSAGE });
    }

    return res.status(500).json({ success: false, message: CHATBOT_FALLBACK_MESSAGE });
  }
});

router.post(
  "/submit",
  auth(["student"]),
  uploadEvidence.single("evidence"),
  async (req, res) => {
    try {
      logEvidenceFileDiagnostic("/submit", req.file);
      const finalData = parseFinalData(req.body?.finalData);
      if (!finalData) {
        return res.status(400).json({ error: "finalData tidak valid." });
      }

      const kronologi = String(finalData.kronologi || "").trim();
      if (!kronologi) {
        return res.status(400).json({
          error: "Kronologi kejadian wajib diisi.",
        });
      }

      const userId = getRequestUserId(req);
      const activeDraft = req.file
        ? await replaceDraftEvidence(userId, req.file)
        : await findActiveChatbotDraft(userId);
      const payload = buildComplaintPayload(req.user, userId, finalData, activeDraft);

      const result = await createComplaint(payload);
      const created = await findComplaintById(result.insertedId);
      await deleteActiveChatbotDraft(userId);

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
  async (req, res) => {
    try {
      logEvidenceFileDiagnostic("/upload-evidence", req.file);
      if (!req.file) {
        return res.status(400).json({ error: "File tidak ditemukan." });
      }

      const draft = await replaceDraftEvidence(getRequestUserId(req), req.file);
      const fileData = normalizeDraftEvidence(draft);

      return res.status(200).json({ success: true, file: fileData, draft: fileData });
    } catch (error) {
      console.error("[Chatbot Error] Upload evidence error:", error);
      return res.status(500).json({ error: "Gagal mengupload bukti." });
    }
  }
);

router.delete("/evidence", auth(["student"]), async (req, res) => {
  try {
    await deleteDraftAndEvidence(getRequestUserId(req));
    return res.status(200).json({ success: true, draft: null });
  } catch (error) {
    console.error("[Chatbot Error] Delete evidence error:", error);
    return res.status(500).json({ error: "Gagal menghapus bukti." });
  }
});

module.exports = router;
