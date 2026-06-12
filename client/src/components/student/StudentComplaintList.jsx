import {
  formatDate,
  getStatusLabel,
  getUrgencyBadgeClass,
  getUrgencyValue,
} from "../../utils/formatters";

const EvidencePreview = ({ complaint, resolveMediaUrl }) => {
  if (!complaint.evidenceUrl) {
    return <span className="muted small">Tidak ada bukti</span>;
  }

  const mediaUrl = resolveMediaUrl(complaint.evidenceUrl);
  if (complaint.evidenceType?.startsWith("image/")) {
    return (
      <img
        className="student-evidence-preview"
        src={mediaUrl}
        alt={complaint.evidenceName || "Bukti pengaduan"}
      />
    );
  }

  if (complaint.evidenceType?.startsWith("video/")) {
    return (
      <video className="student-evidence-preview" src={mediaUrl} controls preload="metadata" />
    );
  }

  return (
    <a href={mediaUrl} target="_blank" rel="noreferrer" className="ghost-link">
      Lihat bukti
    </a>
  );
};

const StudentComplaintList = ({
  loading,
  filtered,
  filter,
  setFilter,
  statusOptions,
  statusColor,
  fetchComplaints,
  resolveMediaUrl,
  onOpenDetail,
}) => (
  <div className="card schedule-card">
    <div className="card-head">
      <div>
        <h3>Pengaduan Anda</h3>
      </div>
      <div className="filters">
        <label>Status</label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Semua</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button className="ghost" onClick={() => fetchComplaints()}>
          Muat ulang
        </button>
      </div>
    </div>

    {loading ? (
      <div className="empty">Memuat data...</div>
    ) : filtered.length === 0 ? (
      <div className="empty">Belum ada pengaduan yang dikirim.</div>
    ) : (
      <div className="table-card student-complaints-table">
        <div className="table-slim head student-complaints-head">
          <span>Status</span>
          <span>Kategori</span>
          <span>Tipe</span>
          <span>Pesan</span>
          <span>Bukti</span>
          <span>Tanggal</span>
        </div>
        {filtered.map((complaint) => {
          const urgency = getUrgencyValue(complaint);

          return (
            <div key={complaint.id} className="table-slim student-complaints-row">
              <span data-label="Status">
                <span className={statusColor[complaint.status] || "badge"}>
                  {getStatusLabel(statusOptions, complaint.status)}
                </span>
              </span>
              <span data-label="Kategori">{complaint.category}</span>
              <span className="muted small" data-label="Tipe">
                {complaint.isAnonymous ? "Anonim" : "Tidak anonim"}
              </span>
              <span data-label="Pesan">
                <div className="student-message-preview">{complaint.message}</div>
                {urgency && <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>}
                <button
                  type="button"
                  className="ghost student-detail-button"
                  onClick={() => onOpenDetail(complaint)}
                >
                  Lihat detail
                </button>
              </span>
              <span data-label="Bukti">
                <EvidencePreview complaint={complaint} resolveMediaUrl={resolveMediaUrl} />
              </span>
              <span className="muted small" data-label="Tanggal">
                {formatDate(complaint.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default StudentComplaintList;
