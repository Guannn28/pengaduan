import { formatDate } from "../../utils/formatters";

const StudentAccountRow = ({ account, handleDeleteStudentAccount }) => (
  <div className="table-slim student-account-row">
    <span data-label="Nama">
      <strong>{account.name}</strong>
    </span>
    <span data-label="Username">{account.username || "-"}</span>
    <span data-label="Kelas">{account.className || "-"}</span>
    <span data-label="Tanggal Dibuat" className="muted small">
      {formatDate(account.createdAt)}
    </span>
    <span data-label="Status">
      <span className="badge success">Aktif</span>
    </span>
    <span className="admin-actions" data-label="Aksi">
      <button
        type="button"
        className="ghost danger-text small-btn"
        onClick={() => handleDeleteStudentAccount(account.id)}
      >
        Hapus Akun
      </button>
    </span>
  </div>
);

const StudentAccountsSection = ({
  studentAccounts,
  studentAccountsLoading,
  fetchStudentAccounts,
  handleDeleteStudentAccount,
  error,
  successMessage,
}) => (
  <section className="card schedule-card">
    <div className="card-head">
      <div>
        <h3>Data Akun Siswa</h3>
        <p className="muted small">Daftar akun siswa aktif yang tersimpan di sistem login.</p>
      </div>
      <button className="ghost" type="button" onClick={() => fetchStudentAccounts()}>
        Muat ulang
      </button>
    </div>

    {error && <div className="alert">{error}</div>}
    {successMessage && <div className="alert success-alert">{successMessage}</div>}

    {studentAccountsLoading ? (
      <div className="empty">Memuat data akun siswa...</div>
    ) : studentAccounts.length === 0 ? (
      <div className="empty">Belum ada data akun siswa.</div>
    ) : (
      <div className="table-card admin-table student-account-table">
        <div className="table-slim head student-account-row">
          <span>Nama</span>
          <span>Username</span>
          <span>Kelas</span>
          <span>Tanggal Dibuat</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>
        {studentAccounts.map((account) => (
          <StudentAccountRow
            key={account.id}
            account={account}
            handleDeleteStudentAccount={handleDeleteStudentAccount}
          />
        ))}
      </div>
    )}
  </section>
);

export default StudentAccountsSection;
