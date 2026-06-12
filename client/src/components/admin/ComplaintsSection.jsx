import {
  formatDate,
  getStatusLabel,
  getUrgencyBadgeClass,
  getUrgencyValue,
} from "../../utils/formatters";

const ComplaintRow = ({
  complaint,
  resolveMediaUrl,
  statusOptions,
  statusColor,
  handleStatus,
  handleDelete,
  handleDownloadEvidence,
  onOpenDetail,
}) => {
  const mediaUrl = complaint.evidenceUrl ? resolveMediaUrl(complaint.evidenceUrl) : "";
  const messagePreview = String(complaint.message || "").trim();
  const urgency = getUrgencyValue(complaint);

  return (
    <div className="table-slim complaints-row">
      <span data-label="Pelapor">
        <strong>{complaint.name}</strong>
        <p className="muted small">
          {complaint.isAnonymous ? "Identitas disembunyikan" : complaint.username || "-"}
        </p>
      </span>
      <span data-label="Kategori">
        <strong>{complaint.category || "-"}</strong>
        {urgency && <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>}
      </span>
      <span data-label="Pesan">
        <div className="complaint-message-preview">{messagePreview || "Tidak ada pesan."}</div>
        <button
          className="ghost complaint-detail-button"
          type="button"
          onClick={() => onOpenDetail(complaint)}
        >
          Lihat detail
        </button>
      </span>
      <span data-label="Bukti">
        {!complaint.evidenceUrl ? (
          <span className="muted small">Tidak ada</span>
        ) : (
          <div className="evidence-actions">
            {complaint.evidenceType?.startsWith("image/") ? (
              <img
                className="evidence-preview"
                src={mediaUrl}
                alt={complaint.evidenceName || "Bukti"}
              />
            ) : complaint.evidenceType?.startsWith("video/") ? (
              <video className="evidence-preview" src={mediaUrl} controls preload="metadata" />
            ) : (
              <a href={mediaUrl} target="_blank" rel="noreferrer" className="ghost-link">
                Lihat bukti
              </a>
            )}
            <button
              className="ghost small-btn"
              type="button"
              onClick={() => handleDownloadEvidence(complaint)}
            >
              Download
            </button>
          </div>
        )}
      </span>
      <span data-label="Status">
        <span className={statusColor[complaint.status] || "badge"}>
          {getStatusLabel(statusOptions, complaint.status)}
        </span>
      </span>
      <span className="muted small" data-label="Tanggal">
        {formatDate(complaint.createdAt)}
      </span>
      <span className="admin-actions" data-label="Aksi">
        <select
          value={complaint.status}
          onChange={(event) => handleStatus(complaint.id, event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className="ghost danger-text"
          type="button"
          onClick={() => handleDelete(complaint.id)}
        >
          Hapus
        </button>
      </span>
    </div>
  );
};

const ComplaintsSection = ({
  loading,
  filtered,
  filter,
  setFilter,
  resolveMediaUrl,
  statusOptions,
  statusColor,
  fetchComplaints,
  handleStatus,
  handleDelete,
  handleDownloadEvidence,
  setSelectedComplaint,
  error,
  successMessage,
}) => (
  <section className="card schedule-card">
    <div className="card-head">
      <div>
        <h3>Daftar Pengaduan</h3>
        <p className="muted small">
          Tinjau laporan, ubah status penanganan, atau unduh bukti jika diperlukan.
        </p>
      </div>
      <div className="filters">
        <label>Status</label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Semua</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="ghost" type="button" onClick={() => fetchComplaints()}>
          Muat ulang
        </button>
      </div>
    </div>

    {error && <div className="alert">{error}</div>}
    {successMessage && <div className="alert success-alert">{successMessage}</div>}

    {loading ? (
      <div className="empty">Memuat data...</div>
    ) : filtered.length === 0 ? (
      <div className="empty">Belum ada pengaduan yang masuk.</div>
    ) : (
      <div className="table-card admin-table complaints-table">
        <div className="table-slim head complaints-row-head">
          <span>Pelapor</span>
          <span>Kategori</span>
          <span>Pesan</span>
          <span>Bukti</span>
          <span>Status</span>
          <span>Tanggal</span>
          <span>Aksi</span>
        </div>
        {filtered.map((complaint) => (
          <ComplaintRow
            key={complaint.id}
            complaint={complaint}
            resolveMediaUrl={resolveMediaUrl}
            statusOptions={statusOptions}
            statusColor={statusColor}
            handleStatus={handleStatus}
            handleDelete={handleDelete}
            handleDownloadEvidence={handleDownloadEvidence}
            onOpenDetail={setSelectedComplaint}
          />
        ))}
      </div>
    )}
  </section>
);

export default ComplaintsSection;
