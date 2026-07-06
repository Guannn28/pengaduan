import { Paperclip, Image, X, CheckCircle, Loader2 } from "lucide-react";

const renderFinalValue = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "Tidak ada";
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    const values = Object.entries(value)
      .map(([key, item]) => `${key}: ${renderFinalValue(item)}`)
      .join(", ");
    return values || "Tidak ada";
  }
  return value || "Tidak ada";
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const FinalReportSummary = ({
  chatFinalData,
  chatSubmitting,
  handleChatSubmitComplaint,
  chatAttachment,
  chatUploadedEvidence,
  chatAttachUploading,
  handleChatAttach,
  handleChatRemoveAttachment,
}) => {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      handleChatAttach(file);
    }
    event.target.value = "";
  };

  const handleRemoveFile = () => {
    handleChatRemoveAttachment();
  };

  const evidenceName =
    chatUploadedEvidence?.evidenceName || chatAttachment?.name || "Bukti pengaduan";
  const evidenceSize = chatUploadedEvidence?.evidenceSize || chatAttachment?.size || 0;
  const evidenceType =
    chatUploadedEvidence?.evidenceMimeType ||
    chatUploadedEvidence?.evidenceType ||
    chatAttachment?.type ||
    "";
  const evidenceUrl = chatUploadedEvidence?.evidenceUrl || chatAttachment?.url || "";
  const showImagePreview = evidenceUrl && evidenceType.startsWith("image/");
  const evidenceStatusText = chatAttachUploading
    ? "Mengunggah..."
    : evidenceUrl
      ? "Sudah terlampir"
      : "Dipilih, akan diunggah saat dikirim";

  return (
    <div className="final-summary">
      <div className="final-summary-head">
        <div>
          <h4>Ringkasan Laporan</h4>
          <p className="muted small">Periksa kembali data berikut sebelum mengirim laporan.</p>
        </div>
        <span className="summary-badge">
          <CheckCircle size={13} strokeWidth={2.5} />
          Siap Dikirim
        </span>
      </div>
      <div className="final-summary-grid">
        <div>
          <span>Kategori</span>
          <strong>{renderFinalValue(chatFinalData.kategori)}</strong>
        </div>
        <div>
          <span>Urgensi</span>
          <strong>{renderFinalValue(chatFinalData.urgensi)}</strong>
        </div>
        <div>
          <span>Kronologi</span>
          <strong>{renderFinalValue(chatFinalData.kronologi)}</strong>
        </div>
        <div>
          <span>Lokasi</span>
          <strong>{renderFinalValue(chatFinalData.lokasi)}</strong>
        </div>
        <div>
          <span>Waktu Kejadian</span>
          <strong>{renderFinalValue(chatFinalData.waktu)}</strong>
        </div>
        <div>
          <span>Pihak Terlibat</span>
          <strong>{renderFinalValue(chatFinalData.pihakTerlibat)}</strong>
        </div>
        <div>
          <span>Saksi</span>
          <strong>{renderFinalValue(chatFinalData.saksi)}</strong>
        </div>
        <div>
          <span>Keterangan Bukti</span>
          <strong>{renderFinalValue(chatFinalData.bukti)}</strong>
        </div>
        <div className="final-summary-wide">
          <span>Harapan Pelapor</span>
          <strong>{renderFinalValue(chatFinalData.harapan)}</strong>
        </div>
      </div>
      <div className="chat-evidence-upload">
        <label>
          <Paperclip size={14} strokeWidth={2} />
          Lampiran Bukti (Opsional)
        </label>

        {chatAttachment ? (
          <div className="evidence-image-preview-wrap">
            {showImagePreview ? (
              <img
                src={evidenceUrl}
                alt="Preview foto bukti"
                className="evidence-image-preview-thumb"
              />
            ) : (
              <div className="evidence-image-preview-thumb evidence-file-preview-icon">
                <Image size={24} strokeWidth={1.7} />
              </div>
            )}
            <div className="evidence-image-preview-info">
              <strong>{evidenceName}</strong>
              <span>{formatFileSize(evidenceSize)}</span>
              {evidenceUrl && (
                <a href={evidenceUrl} target="_blank" rel="noreferrer" className="ghost-link">
                  Buka lampiran
                </a>
              )}
              <span className="evidence-ready-text">
                {evidenceStatusText}
              </span>
            </div>
            <button
              type="button"
              className="evidence-remove-btn"
              onClick={handleRemoveFile}
              title="Hapus foto ini"
              disabled={chatAttachUploading}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="file-drop-zone">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
            />
            <div className="file-drop-icon">
              <Image size={28} strokeWidth={1.5} color="var(--text-muted)" />
            </div>
            <div className="file-drop-text">Klik untuk memilih foto bukti</div>
            <div className="file-drop-hint">Format yang diterima: JPEG, JPG, PNG - Ukuran maksimal 5 MB</div>
          </div>
        )}
      </div>
      <div className="form-actions final-summary-actions">
        <button
          className="primary submit-report-btn"
          type="button"
          onClick={handleChatSubmitComplaint}
          disabled={chatSubmitting || chatAttachUploading}
        >
          {chatSubmitting || chatAttachUploading ? (
            <>
              <Loader2 className="inline-spinner" size={16} strokeWidth={2.5} />
              {chatAttachUploading ? "Mengunggah Bukti..." : "Mengirim Laporan..."}
            </>
          ) : (
            "Kirim Laporan"
          )}
        </button>
      </div>
    </div>
  );
};

export default FinalReportSummary;
