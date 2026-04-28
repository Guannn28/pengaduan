const ComplaintRow = ({
  complaint,
  resolveMediaUrl,
  statusOptions,
  statusColor,
  handleStatus,
  handleDelete,
  handleDownloadEvidence,
}) => {
  const mediaUrl = complaint.evidenceUrl ? resolveMediaUrl(complaint.evidenceUrl) : "";

  return (
    <div className="table-slim">
      <span data-label="Pelapor">
        <strong>{complaint.name}</strong>
        <p className="muted small">{complaint.email}</p>
      </span>
      <span data-label="Kategori">{complaint.category}</span>
      <span className="message" data-label="Pesan">{complaint.message}</span>
      <span data-label="Bukti">
        {!complaint.evidenceUrl ? (
          <span className="muted small">Tidak ada</span>
        ) : (
          <div className="evidence-actions">
            {complaint.evidenceType?.startsWith("image/") ? (
              <img
                className="evidence-thumb"
                src={mediaUrl}
                alt={complaint.evidenceName || "Bukti"}
              />
            ) : complaint.evidenceType?.startsWith("video/") ? (
              <video className="evidence-thumb" src={mediaUrl} controls preload="metadata" />
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
          {statusOptions.find((option) => option.value === complaint.status)?.label ??
            complaint.status}
        </span>
      </span>
      <span className="muted small" data-label="Tanggal">
        {new Date(complaint.createdAt).toLocaleString("id-ID")}
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

const AccountRequestRow = ({ request, resolveMediaUrl, handleUseAccountRequest }) => {
  const mediaUrl = request.studentCardUrl ? resolveMediaUrl(request.studentCardUrl) : "";

  return (
    <div className="table-slim account-request-row">
      <span data-label="Pemohon">
        <strong>{request.name}</strong>
        <p className="muted small">{request.email}</p>
      </span>
      <span data-label="Kelas">{request.className || "-"}</span>
      <span data-label="Kartu Pelajar">
        {!request.studentCardUrl ? (
          <span className="muted small">Tidak ada</span>
        ) : request.studentCardType?.startsWith("image/") ? (
          <img
            className="evidence-thumb"
            src={mediaUrl}
            alt={request.studentCardName || "Kartu pelajar"}
          />
        ) : (
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="ghost-link">
            Lihat lampiran
          </a>
        )}
      </span>
      <span data-label="Status">
        <span className={request.status === "pending" ? "badge warning" : "badge success"}>
          {request.status === "pending" ? "Menunggu" : "Ditinjau"}
        </span>
      </span>
      <span className="muted small" data-label="Tanggal">
        {new Date(request.createdAt).toLocaleString("id-ID")}
      </span>
      <span className="admin-actions" data-label="Aksi">
        <button type="button" className="ghost" onClick={() => handleUseAccountRequest(request)}>
          Pakai Data Ini
        </button>
      </span>
    </div>
  );
};

const AdminPage = ({
  user,
  logout,
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
  accountRequests,
  fetchAccountRequests,
  createUserForm,
  setCreateUserForm,
  handleCreateUser,
  creatingUser,
  handleUseAccountRequest,
  error,
  successMessage,
}) => (
  <div className="student-shell">
    <div className="student-main">
      <header className="student-header">
        <div className="brand-inline">
          <img className="brand-logo" src="/ubl-logo.png" alt="UBL Logo" />
          <div className="brand-text">
            <p className="muted small">Universitas</p>
            <strong className="title">Bandar Lampung</strong>
          </div>
        </div>
        <div className="header-actions">
          <div className="user-chip">
            <div>
              <strong>{user?.name}</strong>
              <p className="muted small">Admin</p>
            </div>
          </div>
          <button className="ghost" type="button" onClick={logout}>
            Keluar
          </button>
        </div>
      </header>

      <main className="student-content">
        <section className="welcome-card">
          <div>
            <p className="muted small">Dashboard Admin</p>
            <h2>Kelola pengaduan dan pembuatan akun</h2>
            <p className="muted">
              Tinjau permohonan akun, buat akun siswa atau admin, lalu kelola pengaduan yang masuk.
            </p>
          </div>
          <div className="quick-row">
            <div className="quick-card">
              <p className="label">Total Pengaduan</p>
              <strong>{filtered.length}</strong>
            </div>
            <div className="quick-card">
              <p className="label">Permohonan Akun</p>
              <strong>{accountRequests.filter((item) => item.status === "pending").length}</strong>
            </div>
            <div className="quick-card">
              <p className="label">Kasus Pembulian</p>
              <strong>
                {filtered.filter((item) => item.category === "Kasus Pembulian").length}
              </strong>
            </div>
          </div>
        </section>

        <section className="student-grid admin-grid">
          <div className="card schedule-card">
            <div className="card-head">
              <div>
                <h3>Permohonan Akun</h3>
                <p className="muted small">
                  Data ini dikirim dari halaman registrasi dan bisa dipakai untuk mengisi form akun.
                </p>
              </div>
              <button className="ghost" type="button" onClick={() => fetchAccountRequests()}>
                Muat ulang permohonan
              </button>
            </div>

            {accountRequests.length === 0 ? (
              <div className="empty">Belum ada permohonan akun.</div>
            ) : (
              <div className="table-card admin-table">
                <div className="table-slim head account-request-row">
                  <span>Pemohon</span>
                  <span>Kelas</span>
                  <span>Kartu Pelajar</span>
                  <span>Status</span>
                  <span>Tanggal</span>
                  <span>Aksi</span>
                </div>
                {accountRequests.map((request) => (
                  <AccountRequestRow
                    key={request.id}
                    request={request}
                    resolveMediaUrl={resolveMediaUrl}
                    handleUseAccountRequest={handleUseAccountRequest}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="card submit-card">
            <h3>Buat Akun Baru</h3>
            <p className="muted small">
              Admin dapat membuat akun dengan role siswa atau admin.
            </p>
            {error && <div className="alert">{error}</div>}
            {successMessage && <div className="alert success-alert">{successMessage}</div>}
            <form
              className="form stacked"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreateUser();
              }}
            >
              <label>
                Nama Lengkap
                <input
                  type="text"
                  value={createUserForm.name}
                  onChange={(event) =>
                    setCreateUserForm({ ...createUserForm, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(event) =>
                    setCreateUserForm({ ...createUserForm, email: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="text"
                  value={createUserForm.password}
                  onChange={(event) =>
                    setCreateUserForm({ ...createUserForm, password: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={createUserForm.role}
                  onChange={(event) =>
                    setCreateUserForm({ ...createUserForm, role: event.target.value })
                  }
                >
                  <option value="student">Siswa</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              {createUserForm.role === "student" && (
                <label>
                  Nama Kelas
                  <input
                    type="text"
                    value={createUserForm.className}
                    onChange={(event) =>
                      setCreateUserForm({ ...createUserForm, className: event.target.value })
                    }
                    required
                  />
                </label>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={
                    creatingUser ||
                    !createUserForm.name.trim() ||
                    !createUserForm.email.trim() ||
                    !createUserForm.password.trim() ||
                    (createUserForm.role === "student" && !createUserForm.className.trim())
                  }
                >
                  {creatingUser ? "Membuat..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="card schedule-card">
          <div className="card-head">
            <div>
              <h3>Daftar Pengaduan</h3>
              <p className="muted small">
                Ubah status tindak lanjut atau hapus data yang tidak diperlukan.
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

          {loading ? (
            <div className="empty">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Belum ada pengaduan yang masuk.</div>
          ) : (
            <div className="table-card admin-table">
              <div className="table-slim head">
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
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  </div>
);

export default AdminPage;
