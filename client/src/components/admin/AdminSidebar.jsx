import { FileText, Home, UserPlus, Users } from "lucide-react";

const navIcons = { dashboard: Home, "account-requests": UserPlus, "student-accounts": Users, complaints: FileText };

const AdminSidebar = ({
  user,
  adminView,
  setAdminView,
  navItems,
  pendingCount,
  inProgressCount,
  complaintTotal,
}) => (
  <aside className="overview-rail admin-rail">
    <div className="rail-profile">
      <div className="avatar rail-avatar">AD</div>
      <div>
        <p className="muted small">Panel admin</p>
        <strong>{user?.name}</strong>
        <span>Pengelola laporan sekolah</span>
      </div>
    </div>
    <div className="rail-stats">
      <div>
        <span>Akun baru</span>
        <strong>{pendingCount}</strong>
      </div>
      <div>
        <span>Diproses</span>
        <strong>{inProgressCount}</strong>
      </div>
      <div>
        <span>Pengaduan</span>
        <strong>{complaintTotal}</strong>
      </div>
    </div>
    <div className="rail-tabs">
      {navItems.map((item) => {
        const Icon = navIcons[item.value] || FileText;
        return (
          <button
            key={item.value}
            type="button"
            className={adminView === item.value ? "rail-tab active" : "rail-tab"}
            onClick={() => setAdminView(item.value)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  </aside>
);

export default AdminSidebar;
