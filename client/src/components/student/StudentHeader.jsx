import { Menu, RefreshCw } from "lucide-react";

const StudentHeader = ({ user, initials, fetchComplaints, logout, onOpenMobileNav }) => (
  <header className="student-header">
    <button
      className="mobile-menu-button"
      type="button"
      onClick={onOpenMobileNav}
      aria-label="Buka menu navigasi"
      title="Buka menu"
    >
      <Menu size={21} strokeWidth={2.5} />
    </button>
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
        <RefreshCw size={18} strokeWidth={2.5} />
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
    <div className="mobile-user-summary" aria-label="Profil siswa">
      <span>{user?.name || "Siswa"}</span>
      <div className="avatar sm">{initials}</div>
    </div>
  </header>
);

export default StudentHeader;
