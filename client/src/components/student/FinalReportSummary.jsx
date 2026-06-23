import { useState } from "react";
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
  chatEvidence,
  setChatEvidence,
  chatEvidenceInputKey,
  chatSubmitting,
  handleChatSubmitComplaint,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setChatEvidence(file);

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setChatEvidence(null);
    setPreviewUrl(null);
  };

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
          <span>Bukti Tambahan</span>
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
          Lampiran Foto Bukti (Opsional)
        </label>

        {chatEvidence && previewUrl ? (
          <div className="evidence-image-preview-wrap">
            <img
              src={previewUrl}
              alt="Preview foto bukti"
              className="evidence-image-preview-thumb"
            />
            <div className="evidence-image-preview-info">
              <strong>{chatEvidence.name}</strong>
              <span>{formatFileSize(chatEvidence.size)}</span>
              <span className="evidence-ready-text">
                Siap diunggah
              </span>
            </div>
            <button
              type="button"
              className="evidence-remove-btn"
              onClick={handleRemoveFile}
              title="Hapus foto ini"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="file-drop-zone">
            <input
              key={chatEvidenceInputKey}
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
          disabled={chatSubmitting}
        >
          {chatSubmitting ? (
            <>
              <Loader2 className="inline-spinner" size={16} strokeWidth={2.5} />
              Mengirim Laporan...
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
