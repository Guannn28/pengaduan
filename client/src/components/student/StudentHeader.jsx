const StudentHeader = ({ user, initials, fetchComplaints, logout }) => (
  <header className="student-header">
    <div className="brand-inline">
      <img className="brand-logo" src="/logo-sma.jpg" alt="SMA Logo" />
      <div className="brand-text">
        <p className="muted small">SMA Negeri 1</p>
        <strong className="title">Bangunrejo</strong>
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
          <p className="muted small">Siswa{user?.className ? ` - ${user.className}` : ""}</p>
        </div>
        <div className="avatar sm">{initials}</div>
      </div>
      <button className="ghost" type="button" onClick={logout}>
        Keluar
      </button>
    </div>
  </header>
);

export default StudentHeader;
