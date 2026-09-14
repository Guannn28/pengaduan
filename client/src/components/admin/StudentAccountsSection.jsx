import { useMemo, useState } from "react";
import { MoreHorizontal, RefreshCw, UserRoundSearch, Users } from "lucide-react";
import { formatDate } from "../../utils/formatters";
import { Button, ConfirmationDialog, EmptyState, LoadingSkeleton, SearchField } from "../shared/ui";

const PAGE_SIZE = 8;

const StudentAccountRow = ({ account, onDelete }) => (
  <div className="data-row student-account-row admin-student-card">
    <span data-label="Nama"><strong>{account.name}</strong><small>@{account.username || "-"}</small></span>
    <span data-label="Kelas">{account.className || "-"}</span>
    <span data-label="Tanggal dibuat">{formatDate(account.createdAt)}</span>
    <span data-label="Status"><span className="badge success">Aktif</span></span>
    <span className="row-actions" data-label="Aksi">
      <details className="action-menu">
        <summary aria-label={`Buka menu akun ${account.name}`}><MoreHorizontal size={20} /></summary>
        <div className="action-menu-popover">
          <button type="button" onClick={() => onDelete(account)}>Hapus permanen</button>
        </div>
      </details>
    </span>
  </div>
);

const StudentAccountsSection = ({ studentAccounts, studentAccountsLoading, fetchStudentAccounts, handleDeleteStudentAccount }) => {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const classes = useMemo(() => [...new Set(studentAccounts.map((item) => item.className).filter(Boolean))].sort(), [studentAccounts]);
  const visibleAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return studentAccounts
      .filter((account) => classFilter === "all" || account.className === classFilter)
      .filter((account) => !query || [account.name, account.username, account.className].some((value) => String(value || "").toLowerCase().includes(query)))
      .sort((a, b) => {
        if (sort === "name") return String(a.name).localeCompare(String(b.name), "id");
        if (sort === "class") return String(a.className).localeCompare(String(b.className), "id");
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [studentAccounts, search, classFilter, sort]);
  const totalPages = Math.max(1, Math.ceil(visibleAccounts.length / PAGE_SIZE));
  const pagedAccounts = visibleAccounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = (setter) => (event) => { setter(event.target.value); setPage(1); };

  return (
    <section className="card data-section">
      <header className="card-head"><div><p className="section-eyebrow">Direktori siswa</p><h2>Data akun siswa</h2><p>Kelola akun siswa yang dapat masuk ke sistem.</p></div><Button variant="secondary" type="button" onClick={() => fetchStudentAccounts()}><RefreshCw size={16} /> Perbarui data</Button></header>
      <div className="filter-bar">
        <SearchField value={search} onChange={resetPage(setSearch)} placeholder="Cari nama, username, atau kelas" />
        <label><span>Kelas</span><select value={classFilter} onChange={resetPage(setClassFilter)}><option value="all">Semua kelas</option>{classes.map((className) => <option key={className}>{className}</option>)}</select></label>
        <label><span>Status</span><select disabled><option>Aktif</option></select></label>
        <label><span>Urutkan</span><select value={sort} onChange={resetPage(setSort)}><option value="newest">Terbaru dibuat</option><option value="name">Nama A–Z</option><option value="class">Kelas</option></select></label>
      </div>

      {studentAccountsLoading ? <LoadingSkeleton rows={6} /> : visibleAccounts.length === 0 ? (
        <EmptyState icon={<UserRoundSearch size={30} />} title={studentAccounts.length ? "Akun tidak ditemukan" : "Belum ada akun siswa"} description={studentAccounts.length ? "Coba ubah kata kunci atau filter kelas." : "Akun siswa yang telah dibuat akan muncul di sini."} />
      ) : (
        <>
          <div className="data-table student-account-table">
            <div className="data-row data-head student-account-row"><span>Nama</span><span>Kelas</span><span>Tanggal dibuat</span><span>Status</span><span>Aksi</span></div>
            {pagedAccounts.map((account) => <StudentAccountRow key={account.id} account={account} onDelete={setDeleteTarget} />)}
          </div>
          <footer className="pagination"><span><Users size={16} /> {Math.min(page * PAGE_SIZE, visibleAccounts.length)} dari {visibleAccounts.length} akun</span><div><Button variant="secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button><span>Halaman {page} dari {totalPages}</span><Button variant="secondary" type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button></div></footer>
        </>
      )}

      <ConfirmationDialog open={Boolean(deleteTarget)} title="Hapus akun secara permanen?" description={`Akun ${deleteTarget?.name || "siswa"} tidak dapat digunakan untuk login lagi. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus permanen" onClose={() => setDeleteTarget(null)} onConfirm={async () => { const target = deleteTarget; setDeleteTarget(null); await handleDeleteStudentAccount(target.id); }} />
    </section>
  );
};

export default StudentAccountsSection;
