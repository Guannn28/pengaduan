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

const FinalReportSummary = ({
  chatFinalData,
  chatEvidence,
  setChatEvidence,
  chatEvidenceInputKey,
  chatSubmitting,
  handleChatSubmitComplaint,
}) => (
  <div className="final-summary">
    <div className="final-summary-head">
      <div>
        <h4>Ringkasan Laporan</h4>
        <p className="muted small">Periksa kembali sebelum mengirim laporan.</p>
      </div>
      <span className="summary-badge">Siap dikirim</span>
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
        <span>Waktu</span>
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
      <div>
        <span>Harapan Pelapor</span>
        <strong>{renderFinalValue(chatFinalData.harapan)}</strong>
      </div>
    </div>

    <div className="chat-evidence-upload">
      <label>
        Bukti Tambahan Opsional
        <input
          key={chatEvidenceInputKey}
          type="file"
          accept="image/*,video/*"
          onChange={(event) => setChatEvidence(event.target.files?.[0] || null)}
        />
      </label>
      {chatEvidence && <p className="muted small">File terpilih: {chatEvidence.name}</p>}
    </div>

    <div className="form-actions">
      <button
        className="primary submit-report-btn"
        type="button"
        onClick={handleChatSubmitComplaint}
        disabled={chatSubmitting}
      >
        {chatSubmitting ? "Mengirim laporan..." : "Kirim Laporan"}
      </button>
    </div>
  </div>
);

export default FinalReportSummary;
