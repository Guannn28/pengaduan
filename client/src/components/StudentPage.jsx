const StudentPage = ({
  user,
  form,
  setForm,
  resolveMediaUrl,
  submitting,
  handleSubmit,
  logout,
  error,
  complaintCategories,
  loading,
  filtered,
  filter,
  setFilter,
  statusOptions,
  statusColor,
  fetchComplaints,
}) => {
  const initials = (user?.name || user?.email || "M").substring(0, 2).toUpperCase();
  const pendingCount = filtered.filter((c) => c.status === "submitted").length;
  const totalCount = filtered.length;
  const evidencePreviewUrl = form.evidence ? URL.createObjectURL(form.evidence) : "";

  const renderEvidence = (complaint) => {
    if (!complaint.evidenceUrl) {
      return <span className="muted small">Tidak ada</span>;
    }

    const mediaUrl = resolveMediaUrl(complaint.evidenceUrl);
    if (complaint.evidenceType?.startsWith("image/")) {
      return (
        <img
          className="evidence-thumb"
          src={mediaUrl}
          alt={complaint.evidenceName || "Bukti pengaduan"}
        />
      );
    }

    if (complaint.evidenceType?.startsWith("video/")) {
      return (
        <video className="evidence-thumb" src={mediaUrl} controls preload="metadata" />
      );
    }

    return (
      <a href={mediaUrl} target="_blank" rel="noreferrer" className="ghost-link">
        Lihat bukti
      </a>
    );
  };

  return (
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
            <button
              className="icon-btn"
              type="button"
              onClick={() => fetchComplaints()}
              aria-label="Muat ulang pengaduan"
              title="Muat ulang pengaduan"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15.55-6.36L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15.55 6.36L3 16" />
              </svg>
            </button>
            <div className="user-chip">
              <div>
                <strong>{user?.name}</strong>
                <p className="muted small">Siswa{user?.className ? ` • ${user.className}` : ""}</p>
              </div>
              <div className="avatar sm">{initials}</div>
            </div>
            <button className="ghost" type="button" onClick={logout}>
              Keluar
            </button>
          </div>
        </header>

        <main className="student-content">
          <section className="welcome-card">
            <div>
              <p className="muted small">Dashboard Pengaduan</p>
              <h2>Selamat datang di portal pengaduan kampus</h2>
              <p className="muted">
                Fokus pada laporan sarana prasarana, akademik, kasus pembulian, dan lainnya.
              </p>
            </div>
            <div className="quick-row">
              <div className="quick-card">
                <p className="label">Total Pengaduan</p>
                <strong>{totalCount || "0"}</strong>
              </div>
              <div className="quick-card">
                <p className="label">Menunggu Tindakan</p>
                <strong>{pendingCount || "0"}</strong>
              </div>
            </div>
          </section>

          <section className="student-grid">
            <div className="card schedule-card">
              <div className="card-head">
                <div>
                  <h3>Pengaduan Anda</h3>
                </div>
                <div className="filters">
                  <label>Status</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Semua</option>
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
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
                <div className="empty">Belum ada pengaduan.</div>
              ) : (
                <div className="table-card">
                  <div className="table-slim head student-table">
                    <span>Status</span>
                    <span>Kategori</span>
                    <span>Pesan</span>
                    <span>Bukti</span>
                    <span>Tanggal</span>
                  </div>
                  {filtered.map((c) => (
                    <div key={c.id} className="table-slim student-table">
                      <span data-label="Status">
                        <span className={statusColor[c.status] || "badge"}>
                          {statusOptions.find((s) => s.value === c.status)?.label ?? c.status}
                        </span>
                      </span>
                      <span data-label="Kategori">{c.category}</span>
                      <span className="message" data-label="Pesan">{c.message}</span>
                      <span data-label="Bukti">{renderEvidence(c)}</span>
                      <span className="muted small" data-label="Tanggal">
                        {new Date(c.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card submit-card">
              <h3>Ajukan Pengaduan</h3>
              <p className="muted small">
                Sampaikan laporan Anda, termasuk bila terjadi kasus pembulian di lingkungan kampus.
              </p>
              {error && <div className="alert">{error}</div>}
              <form
                className="form stacked"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                <label>
                  Kategori
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {complaintCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Pesan
                  <textarea
                    rows="4"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="Tulis keluhan Anda..."
                  />
                </label>
                <label>
                  Bukti Foto / Video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        evidence: e.target.files?.[0] || null,
                      })
                    }
                    required
                  />
                </label>
                {form.evidence && (
                  <div className="evidence-preview-card">
                    <p className="muted small">File terpilih: {form.evidence.name}</p>
                    {form.evidence.type.startsWith("image/") ? (
                      <img
                        className="evidence-preview"
                        src={evidencePreviewUrl}
                        alt="Preview bukti"
                      />
                    ) : (
                      <video className="evidence-preview" src={evidencePreviewUrl} controls />
                    )}
                  </div>
                )}
                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={submitting || !form.message.trim() || !form.evidence}
                  >
                    {submitting ? "Mengirim..." : "Kirim Pengaduan"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentPage;
