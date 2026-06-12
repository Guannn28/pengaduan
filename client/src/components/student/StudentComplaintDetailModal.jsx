import {
  formatDate,
  getStatusLabel,
  getUrgencyBadgeClass,
  getUrgencyValue,
} from "../../utils/formatters";

const getParsedFieldValue = (selectedComplaintDetail, key) =>
  selectedComplaintDetail.parsedFields.find((field) => field.key === key)?.value || "Tidak ada";

const StudentComplaintDetailModal = ({
  selectedComplaintDetail,
  statusOptions,
  statusColor,
  resolveMediaUrl,
  onClose,
}) => {
  if (!selectedComplaintDetail) return null;

  const urgency = getUrgencyValue(selectedComplaintDetail);
  const statusLabel = getStatusLabel(statusOptions, selectedComplaintDetail.status);
  const typeLabel = selectedComplaintDetail.isAnonymous ? "Anonim" : "Tidak anonim";
  const createdAtLabel = selectedComplaintDetail.createdAt
    ? formatDate(selectedComplaintDetail.createdAt)
    : "Tidak ada";

  return (
    <div
      className="student-complaint-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-complaint-detail-title"
    >
      <button
        type="button"
        className="student-complaint-modal-overlay"
        aria-label="Tutup detail pengaduan"
        onClick={onClose}
      />
      <div className="complaint-detail-content">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 id="student-complaint-detail-title">Detail Pengaduan</h3>
              <p className="muted small">Isi lengkap pengaduan Anda ditampilkan di bawah ini.</p>
            </div>
            <button type="button" className="ghost" onClick={onClose}>
              Tutup
            </button>
          </div>

          <div className="student-complaint-detail-grid">
            <div className="student-complaint-detail-item">
              <span>Status</span>
              <strong>
                <span className={statusColor[selectedComplaintDetail.status] || "badge"}>
                  {statusLabel}
                </span>
              </strong>
            </div>
            <div className="student-complaint-detail-item">
              <span>Kategori</span>
              <strong>{selectedComplaintDetail.category || "Tidak ada"}</strong>
            </div>
            <div className="student-complaint-detail-item">
              <span>Tipe</span>
              <strong>{typeLabel}</strong>
            </div>
            <div className="student-complaint-detail-item">
              <span>Tanggal</span>
              <strong>{createdAtLabel}</strong>
            </div>
            {urgency && (
              <div className="student-complaint-detail-item">
                <span>Urgensi</span>
                <strong>
                  <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>
                </strong>
              </div>
            )}
          </div>

          {selectedComplaintDetail.parsedFields.length > 0 ? (
            <>
              <div className="student-complaint-detail-item">
                <span>Kronologi</span>
                <strong>{getParsedFieldValue(selectedComplaintDetail, "kronologi")}</strong>
              </div>
              <div className="student-complaint-detail-item">
                <span>Lokasi</span>
                <strong>{getParsedFieldValue(selectedComplaintDetail, "lokasi")}</strong>
              </div>
              <div className="student-complaint-detail-item">
                <span>Waktu</span>
                <strong>{getParsedFieldValue(selectedComplaintDetail, "waktu")}</strong>
              </div>
              <div className="student-complaint-detail-item">
                <span>Pihak Terlibat</span>
                <strong>{getParsedFieldValue(selectedComplaintDetail, "pihakTerlibat")}</strong>
              </div>
              <div className="student-complaint-detail-item">
                <span>Saksi</span>
                <strong>{getParsedFieldValue(selectedComplaintDetail, "saksi")}</strong>
              </div>
              <div className="student-complaint-detail-item">
                <span>Bukti Tambahan</span>
                <strong>{getParsedFieldValue(selectedComplaintDetail, "buktiTambahan")}</strong>
              </div>
              <div className="student-complaint-detail-item">
                <span>Harapan Pelapor</span>
                <strong>{getParsedFieldValue(selectedComplaintDetail, "harapanPelapor")}</strong>
              </div>
            </>
          ) : (
            <div className="student-complaint-detail-item">
              <span>Detail Pesan</span>
              <p className="student-complaint-raw">{selectedComplaintDetail.rawMessage || "-"}</p>
            </div>
          )}

          <div className="student-complaint-evidence">
            <span>Bukti</span>
            {!selectedComplaintDetail.evidenceUrl ? (
              <p className="muted small">Tidak ada bukti</p>
            ) : (
              <div className="evidence-actions">
                {selectedComplaintDetail.evidenceType?.startsWith("image/") ? (
                  <img
                    className="student-evidence-preview student-evidence-preview-large"
                    src={resolveMediaUrl(selectedComplaintDetail.evidenceUrl)}
                    alt={selectedComplaintDetail.evidenceName || "Bukti pengaduan"}
                  />
                ) : selectedComplaintDetail.evidenceType?.startsWith("video/") ? (
                  <video
                    className="student-evidence-preview student-evidence-preview-large"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentComplaintDetailModal;
