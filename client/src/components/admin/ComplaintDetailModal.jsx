import {
  formatDate,
  getStatusLabel,
  getUrgencyBadgeClass,
  getUrgencyValue,
} from "../../utils/formatters";

const ComplaintDetailModal = ({
  selectedComplaintDetail,
  statusOptions,
  statusColor,
  resolveMediaUrl,
  handleDownloadEvidence,
  onClose,
}) => {
  if (!selectedComplaintDetail) return null;

  const urgency = getUrgencyValue(selectedComplaintDetail);

  return (
    <div
      className="complaint-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complaint-detail-title"
    >
      <button
        type="button"
        className="complaint-detail-overlay"
        onClick={onClose}
        aria-label="Tutup detail pengaduan"
      />
      <div className="complaint-detail-content">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 id="complaint-detail-title">Detail Pengaduan</h3>
              <p className="muted small">Isi lengkap pengaduan ditampilkan di bawah ini.</p>
            </div>
            <button type="button" className="ghost" onClick={onClose}>
              Tutup
            </button>
          </div>

          <div className="complaint-detail-grid">
            <div className="complaint-detail-item">
              <span>Pelapor</span>
              <strong>{selectedComplaintDetail.name || "-"}</strong>
              <p className="muted small">
                {selectedComplaintDetail.isAnonymous
                  ? "Identitas disembunyikan"
                  : selectedComplaintDetail.username || "-"}
              </p>
            </div>
            <div className="complaint-detail-item">
              <span>Kategori</span>
              <strong>{selectedComplaintDetail.category || "-"}</strong>
            </div>
            {urgency && (
              <div className="complaint-detail-item">
                <span>Urgensi</span>
                <strong>
                  <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>
                </strong>
              </div>
            )}
            <div className="complaint-detail-item">
              <span>Status</span>
              <strong>
                <span className={statusColor[selectedComplaintDetail.status] || "badge"}>
                  {getStatusLabel(statusOptions, selectedComplaintDetail.status)}
                </span>
              </strong>
            </div>
            <div className="complaint-detail-item">
              <span>Tanggal</span>
              <strong>{formatDate(selectedComplaintDetail.createdAt)}</strong>
            </div>
            {selectedComplaintDetail.source && (
              <div className="complaint-detail-item">
                <span>Sumber</span>
                <strong>{selectedComplaintDetail.source}</strong>
              </div>
            )}
          </div>

          <div className="complaint-detail-item complaint-detail-message">
            <span>Detail Laporan</span>
            {selectedComplaintDetail.parsedFields.some((field) => field.value) ? (
              <div className="complaint-detail-message-list">
                {selectedComplaintDetail.parsedFields.map((field) => (
                  <div key={field.key} className="complaint-detail-message-row">
                    <strong>{field.label}</strong>
                    <p>{field.value || "Tidak ada"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="complaint-detail-raw">
                {selectedComplaintDetail.rawMessage || "-"}
              </p>
            )}
          </div>

          <div className="complaint-detail-item">
            <span>Bukti File</span>
            {!selectedComplaintDetail.evidenceUrl ? (
              <p className="muted small">Tidak ada bukti.</p>
            ) : (
              <div className="evidence-actions">
                {selectedComplaintDetail.evidenceType?.startsWith("image/") ? (
                  <img
                    className="evidence-preview complaint-preview-thumb"
                    src={resolveMediaUrl(selectedComplaintDetail.evidenceUrl)}
                    alt={selectedComplaintDetail.evidenceName || "Bukti"}
                  />
                ) : selectedComplaintDetail.evidenceType?.startsWith("video/") ? (
                  <video
                    className="evidence-preview complaint-preview-thumb"
                    src={resolveMediaUrl(selectedComplaintDetail.evidenceUrl)}
                    controls
                    preload="metadata"
                  />
                ) : (
                  <a
                    href={resolveMediaUrl(selectedComplaintDetail.evidenceUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="ghost-link"
                  >
                    Lihat bukti
                  </a>
                )}
                <p className="muted small">
                  {selectedComplaintDetail.evidenceName || "Bukti pengaduan"}
                </p>
                <button
                  className="ghost small-btn"
                  type="button"
                  onClick={() => handleDownloadEvidence(selectedComplaintDetail)}
                >
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;
