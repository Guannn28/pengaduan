import { FileText, RefreshCw, Search } from "lucide-react";
import { formatDate, getStatusLabel, getUrgencyBadgeClass, getUrgencyValue } from "../../utils/formatters";
import { Button, EmptyState, LoadingSkeleton } from "../shared/ui";

const StudentComplaintList = ({ loading, complaints, filtered, filter, setFilter, statusOptions, statusColor, fetchComplaints, onOpenDetail, onCreateFirst }) => {
  const summaryItems = [
    { value: "all", label: "Semua", count: complaints.length },
    {
      value: "in_progress",
      label: "Diproses",
      count: complaints.filter((complaint) => complaint.status === "in_progress").length,
    },
    {
      value: "resolved",
      label: "Selesai",
      count: complaints.filter((complaint) => complaint.status === "resolved").length,
    },
  ];

  return (
    <section className="card history-card">
    <header className="card-head history-head">
      <div>
        <p className="section-eyebrow">Aktivitas Anda</p>
        <h2>Riwayat Pengaduan</h2>
        <p>Daftar laporan dan perkembangan penanganannya.</p>
      </div>
      <div className="filters history-filters">
        <label><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option>{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
        <Button variant="secondary" onClick={() => fetchComplaints()} type="button"><RefreshCw size={16} /> Perbarui data</Button>
      </div>
    </header>

    <div className="history-status-summary" aria-label="Ringkasan dan filter status pengaduan">
      {summaryItems.map((item) => (
        <button
          key={item.value}
          type="button"
          className={filter === item.value ? "history-summary-button active" : "history-summary-button"}
          onClick={() => setFilter(item.value)}
          aria-pressed={filter === item.value}
          aria-label={`${item.label}, ${item.count} pengaduan`}
        >
          <span>{item.label}</span>
          <strong>{item.count}</strong>
        </button>
      ))}
    </div>

    {loading ? <LoadingSkeleton rows={4} /> : filtered.length === 0 ? (
      <EmptyState
        icon={filter === "all" ? <FileText size={30} /> : <Search size={30} />}
        title={filter === "all" ? "Belum ada pengaduan" : "Tidak ada hasil pada status ini"}
        description={filter === "all" ? "Anda belum pernah mengirim pengaduan." : "Pilih status lain untuk melihat pengaduan Anda."}
        action={filter === "all" ? <Button type="button" onClick={onCreateFirst}>Buat pengaduan pertama</Button> : <Button variant="secondary" type="button" onClick={() => setFilter("all")}>Lihat semua status</Button>}
      />
    ) : (
      <div className="student-report-list">
        {filtered.map((complaint) => {
          const urgency = getUrgencyValue(complaint);
          return (
            <article className="student-report-card" key={complaint.id}>
              <div className="student-report-main">
                <div className="student-report-title-row">
                  <div><h3>{complaint.category || "Pengaduan"}</h3><p>{formatDate(complaint.createdAt)}</p></div>
                  <span className={statusColor[complaint.status] || "badge"}>{getStatusLabel(statusOptions, complaint.status)}</span>
                </div>
                <p className="student-message-preview">{complaint.message || "Tidak ada cuplikan pengaduan."}</p>
                <div className="student-report-meta">
                  {urgency && <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>}
                  <span>{complaint.isAnonymous ? "Identitas anonim" : "Identitas terlihat oleh petugas"}</span>
                  <span>{complaint.evidenceUrl ? "1 lampiran" : "Tanpa lampiran"}</span>
                </div>
              </div>
              <Button variant="secondary" type="button" onClick={() => onOpenDetail(complaint)}>Lihat perkembangan</Button>
            </article>
          );
        })}
      </div>
    )}
    </section>
  );
};

export default StudentComplaintList;
