import {
  formatDate,
  getStatusLabel,
  getUrgencyBadgeClass,
  getUrgencyValue,
} from "../../utils/formatters";
import { RefreshCw, FileX, Search } from "lucide-react";

/**
 * Preview foto/video bukti pada baris tabel pengaduan siswa.
 */
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

/**
 * Skeleton Loading — Animasi placeholder shimmer saat data API sedang dimuat.
 * Mencegah tampilan kosong/blank yang membingungkan pengguna.
 */
const SkeletonRows = () => (
  <div className="table-card">
    {[1, 2, 3].map((i) => (
      <div key={i} className="skeleton-row">
        <div className="skeleton skeleton-badge" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="skeleton skeleton-text" style={{ width: "40%" }} />
          <div className="skeleton skeleton-sm" />
        </div>
        <div className="skeleton skeleton-text" style={{ width: "80px" }} />
      </div>
    ))}
  </div>
);

/**
 * Empty State — Tampilan informatif dan empatik ketika tidak ada data pengaduan.
 * Menyesuaikan pesan berdasarkan konteks filter yang aktif.
 */
const EmptyState = ({ filter }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      {filter === "all"
        ? <FileX size={48} strokeWidth={1} color="var(--text-muted)" />
        : <Search size={48} strokeWidth={1} color="var(--text-muted)" />
      }
    </div>
    <h4>
      {filter === "all"
        ? "Belum ada pengaduan"
        : "Tidak ada pengaduan dengan status ini"}
    </h4>
    <p>
      {filter === "all"
        ? "Anda belum pernah mengirim laporan. Gunakan asisten di sebelah kanan untuk membuat pengaduan pertama Anda."
        : "Coba ubah filter status untuk melihat pengaduan lainnya."}
    </p>
  </div>
);

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
        <h3>Riwayat Pengaduan</h3>
        <p className="muted small">Daftar seluruh laporan yang telah Anda kirimkan.</p>
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
        <button className="ghost" onClick={() => fetchComplaints()} type="button" style={{ gap: "7px" }}>
          <RefreshCw size={14} strokeWidth={2.5} />
          Perbarui
        </button>
      </div>
    </div>

    {loading ? (
      <SkeletonRows />
    ) : filtered.length === 0 ? (
      <EmptyState filter={filter} />
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
                {complaint.isAnonymous ? "Anonim" : "Tidak Anonim"}
              </span>
              <span data-label="Pesan">
                <div className="student-message-preview">{complaint.message}</div>
                {urgency && <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>}
                <button
                  type="button"
                  className="ghost student-detail-button"
                  onClick={() => onOpenDetail(complaint)}
                >
                  Lihat Detail
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
