import { useMemo, useState } from "react";
import { Download, FileSearch, MoreHorizontal, Paperclip, RefreshCw } from "lucide-react";
import { formatDate, getStatusLabel, getUrgencyBadgeClass, getUrgencyValue } from "../../utils/formatters";
import { Button, ConfirmationDialog, EmptyState, LoadingSkeleton, SearchField } from "../shared/ui";

const PAGE_SIZE = 10;

const ComplaintRow = ({ complaint, statusOptions, statusColor, handleStatus, onDelete, onOpenDetail }) => {
  const urgency = getUrgencyValue(complaint);
  const openFromRow = (event) => {
    if (event.target.closest("button, select, summary, details, a")) return;
    onOpenDetail(complaint);
  };

  return (
    <div className="data-row complaints-row admin-complaint-card" role="button" tabIndex="0" onClick={openFromRow} onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget) onOpenDetail(complaint); }}>
      <span data-label="Pelapor"><strong>{complaint.isAnonymous ? "Pelapor anonim" : complaint.name || "Pelapor"}</strong><small>{complaint.isAnonymous ? "Identitas dilindungi" : [complaint.className, complaint.username && `@${complaint.username}`].filter(Boolean).join(" · ") || "Data pelapor"}</small></span>
      <span data-label="Pengaduan" className="complaint-cell"><span className="complaint-category-line"><strong>{complaint.category || "Pengaduan"}</strong>{urgency && <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>}</span><span className="complaint-message-preview">{complaint.message || "Tidak ada cuplikan pengaduan."}</span></span>
      <span data-label="Lampiran">{complaint.evidenceUrl ? <span className="attachment-chip"><Paperclip size={14} /> 1 lampiran</span> : <span className="muted">Tidak ada</span>}</span>
      <span data-label="Status dan waktu" className="status-time-cell"><span className={statusColor[complaint.status] || "badge"}>{getStatusLabel(statusOptions, complaint.status)}</span><small>{formatDate(complaint.updatedAt || complaint.createdAt)}</small></span>
      <span className="row-actions" data-label="Aksi"><Button variant="secondary" type="button" onClick={() => onOpenDetail(complaint)}>Tinjau</Button><details className="action-menu"><summary aria-label="Aksi lainnya"><MoreHorizontal size={20} /></summary><div className="action-menu-popover"><label>Ubah status<select value={complaint.status} onChange={(event) => handleStatus(complaint.id, event.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button type="button" onClick={() => onDelete(complaint)}>Hapus pengaduan</button></div></details></span>
    </div>
  );
};

const ComplaintsSection = ({ loading, filtered, filter, setFilter, statusOptions, statusColor, fetchComplaints, handleStatus, handleDelete, handleExportComplaints, setSelectedComplaint }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const categories = useMemo(() => [...new Set(filtered.map((item) => item.category).filter(Boolean))].sort(), [filtered]);
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return filtered.filter((complaint) => {
      const urgency = getUrgencyValue(complaint).toLowerCase();
      const parsedDate = complaint.createdAt ? new Date(complaint.createdAt) : null;
      const createdDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : "";
      return (category === "all" || complaint.category === category)
        && (priority === "all" || urgency.includes(priority))
        && (!date || createdDate === date)
        && (!query || [complaint.name, complaint.username, complaint.className, complaint.category, complaint.message].some((value) => String(value || "").toLowerCase().includes(query)));
    });
  }, [filtered, search, category, priority, date]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const paged = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const updateFilter = (setter) => (event) => { setter(event.target.value); setPage(1); };

  const onExport = async () => {
    if (!handleExportComplaints || exportLoading) return;
    setExportLoading(true);
    try { await handleExportComplaints(); } finally { setExportLoading(false); }
  };

  return (
    <section className="card data-section complaints-section">
      <header className="card-head"><div><p className="section-eyebrow">Kotak masuk</p><h2>Daftar pengaduan</h2><p>Tinjau laporan, perbarui status, dan akses lampiran secara aman.</p></div><div className="card-actions"><Button variant="secondary" type="button" loading={exportLoading} onClick={onExport}><Download size={16} /> Ekspor</Button><Button variant="secondary" type="button" onClick={() => fetchComplaints()}><RefreshCw size={16} /> Perbarui data</Button></div></header>
      <div className="filter-bar complaints-filter-bar">
        <SearchField value={search} onChange={updateFilter(setSearch)} placeholder="Cari pelapor, kategori, atau isi pengaduan" />
        <label><span>Status</span><select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}><option value="all">Semua status</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label><span>Kategori</span><select value={category} onChange={updateFilter(setCategory)}><option value="all">Semua kategori</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Prioritas</span><select value={priority} onChange={updateFilter(setPriority)}><option value="all">Semua prioritas</option><option value="tinggi">Tinggi</option><option value="sedang">Sedang</option><option value="rendah">Rendah</option></select></label>
        <label><span>Tanggal</span><input type="date" value={date} onChange={updateFilter(setDate)} /></label>
      </div>

      {loading ? <LoadingSkeleton rows={7} /> : results.length === 0 ? (
        <EmptyState icon={<FileSearch size={30} />} title={filtered.length ? "Pengaduan tidak ditemukan" : "Belum ada pengaduan"} description={filtered.length ? "Coba ubah pencarian atau filter yang digunakan." : "Pengaduan dari siswa akan muncul di sini."} action={filtered.length ? <Button variant="secondary" type="button" onClick={() => { setSearch(""); setCategory("all"); setPriority("all"); setDate(""); setFilter("all"); }}>Atur ulang filter</Button> : undefined} />
      ) : (
        <>
          <div className="data-table complaints-table"><div className="data-row data-head complaints-row"><span>Pelapor</span><span>Pengaduan</span><span>Lampiran</span><span>Status dan waktu</span><span>Aksi</span></div>{paged.map((complaint) => <ComplaintRow key={complaint.id} complaint={complaint} statusOptions={statusOptions} statusColor={statusColor} handleStatus={handleStatus} onDelete={setDeleteTarget} onOpenDetail={setSelectedComplaint} />)}</div>
          <footer className="pagination"><span>{Math.min(page * PAGE_SIZE, results.length)} dari {results.length} pengaduan</span><div><Button variant="secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button><span>Halaman {page} dari {totalPages}</span><Button variant="secondary" type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button></div></footer>
        </>
      )}
      <ConfirmationDialog open={Boolean(deleteTarget)} title="Hapus pengaduan ini?" description="Pengaduan dan akses terhadap buktinya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan." confirmLabel="Hapus pengaduan" onClose={() => setDeleteTarget(null)} onConfirm={async () => { const target = deleteTarget; setDeleteTarget(null); await handleDelete(target.id); }} />
    </section>
  );
};

export default ComplaintsSection;
