import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";

const StudentHeader = ({ user, initials, logout }) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setIsAccountMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  return (
  <header className="student-header">
    <div className="brand-inline">
      <img className="brand-logo" src="/logo-sma.jpg" alt="Logo SMA Negeri 1 Bangunrejo" />
      <div className="brand-text">
        <p className="muted small">SMA Negeri 1</p>
        <strong className="title">Bangunrejo</strong>
      </div>
    </div>
    <div className="header-actions account-menu-wrap" ref={accountMenuRef}>
      <button className="account-menu-trigger" type="button" onClick={() => setIsAccountMenuOpen((value) => !value)} aria-expanded={isAccountMenuOpen} aria-haspopup="menu" aria-label="Buka menu akun siswa">
        <span className="account-menu-trigger-copy"><strong>{user?.name}</strong><small>Siswa{user?.className ? ` - ${user.className}` : ""}</small></span>
        <span className="avatar sm">{initials}</span>
      </button>
      {isAccountMenuOpen && (
        <div className="account-menu" role="menu" aria-label="Menu akun siswa">
          <div className="account-menu-identity"><strong>{user?.name || "Siswa"}</strong><span>{user?.className || "Kelas belum diisi"}</span></div>
          <button type="button" role="menuitem" onClick={logout}><LogOut size={17} /> Keluar</button>
        </div>
      )}
      <button className="button button-secondary" type="button" onClick={logout}>
        <LogOut size={16} /> Keluar
      </button>
    </div>
  </header>
  );
};

export default StudentHeader;
