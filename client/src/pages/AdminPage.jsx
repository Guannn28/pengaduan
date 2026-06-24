import { useEffect, useMemo, useState } from "react";
import { FileText, Home, LogOut, Menu, UserPlus, Users, X } from "lucide-react";
import AccountRequestsSection from "../components/admin/AccountRequestsSection";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminSidebar from "../components/admin/AdminSidebar";
import ComplaintsSection from "../components/admin/ComplaintsSection";
import ComplaintDetailModal from "../components/shared/ComplaintDetailModal";
import StudentAccountsSection from "../components/admin/StudentAccountsSection";
import { adminNavItems } from "../components/admin/adminUtils";
import {
  complaintDetailLabels,
  parseComplaintMessage,
} from "../utils/formatters";

const adminMobileNavMeta = {
  dashboard: { icon: Home, shortLabel: "Dashboard" },
  "account-requests": { icon: UserPlus, shortLabel: "Pengajuan" },
  "student-accounts": { icon: Users, shortLabel: "Siswa" },
  complaints: { icon: FileText, shortLabel: "Pengaduan" },
};

const AdminPage = ({
  user,
  logout,
  adminView,
  setAdminView,
  loading,
  complaints = [],
  filtered = [],
  filter,
  setFilter,
  resolveMediaUrl,
  statusOptions,
  statusColor,
  fetchComplaints,
  handleStatus,
  handleDelete,
  handleDownloadEvidence,
  accountRequests = [],
  fetchAccountRequests,
  studentAccounts = [],
  studentAccountsLoading,
  fetchStudentAccounts,
  handleDeleteStudentAccount,
  handleExportComplaints,
  createUserForm,
  setCreateUserForm,
  handleCreateUser,
  creatingUser,
  handleUseAccountRequest,
  handleDeleteAccountRequest,
  error,
  successMessage,
}) => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const pendingAccountRequests = accountRequests.filter((item) => item.status === "pending");

  const complaintStats = useMemo(() => {
    const byStatus = complaints.reduce(
      (acc, complaint) => {
        acc[complaint.status] = (acc[complaint.status] || 0) + 1;
        return acc;
      },
      { submitted: 0, in_progress: 0, resolved: 0, rejected: 0 }
    );

    return {
      total: complaints.length,
      submitted: byStatus.submitted || 0,
      inProgress: byStatus.in_progress || 0,
      resolved: byStatus.resolved || 0,
      rejected: byStatus.rejected || 0,
    };
  }, [complaints]);

  const selectedComplaintDetail = useMemo(() => {
    if (!selectedComplaint) {
      return null;
    }

    const parsed = parseComplaintMessage(selectedComplaint.message);
    const parsedFields = parsed.fields.length
      ? parsed.fields
      : complaintDetailLabels.map(([key, label]) => ({ key, label, value: "" }));

    const normalizedFields = complaintDetailLabels.map(([key, label]) => {
      const found = parsedFields.find((field) => field.key === key || field.label === label);
      return {
        key,
        label,
        value: found?.value || "",
      };
    });

    return {
      ...selectedComplaint,
      parsedFields: normalizedFields,
      rawMessage: parsed.raw,
    };
  }, [selectedComplaint]);

  const currentView = adminNavItems.find((item) => item.value === adminView) || adminNavItems[0];
  const mobileAdminNavItems = adminNavItems.map((item) => ({
    ...item,
    icon: adminMobileNavMeta[item.value]?.icon || FileText,
    shortLabel: adminMobileNavMeta[item.value]?.shortLabel || item.label,
  }));
  const recentComplaints = complaints.slice(0, 5);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-lock", isMobileNavOpen);
    return () => document.body.classList.remove("mobile-nav-lock");
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileNavOpen]);

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const handleMobileAdminSelect = (view) => {
    setAdminView(view);
    closeMobileNav();
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const renderView = () => {
    if (adminView === "dashboard") {
      return (
        <AdminDashboard
          complaintStats={complaintStats}
          pendingAccountRequests={pendingAccountRequests}
          studentAccounts={studentAccounts}
          recentComplaints={recentComplaints}
          statusOptions={statusOptions}
          statusColor={statusColor}
          setAdminView={setAdminView}
          setSelectedComplaint={setSelectedComplaint}
          handleUseAccountRequest={handleUseAccountRequest}
        />
      );
    }

    if (adminView === "account-requests") {
      return (
        <AccountRequestsSection
          accountRequests={accountRequests}
          fetchAccountRequests={fetchAccountRequests}
          resolveMediaUrl={resolveMediaUrl}
          handleUseAccountRequest={handleUseAccountRequest}
          handleDeleteAccountRequest={handleDeleteAccountRequest}
          createUserForm={createUserForm}
          setCreateUserForm={setCreateUserForm}
          handleCreateUser={handleCreateUser}
          creatingUser={creatingUser}
          error={error}
          successMessage={successMessage}
        />
      );
    }

    if (adminView === "student-accounts") {
      return (
        <StudentAccountsSection
          studentAccounts={studentAccounts}
          studentAccountsLoading={studentAccountsLoading}
          fetchStudentAccounts={fetchStudentAccounts}
          handleDeleteStudentAccount={handleDeleteStudentAccount}
          error={error}
          successMessage={successMessage}
        />
      );
    }

    if (adminView === "complaints") {
      return (
        <ComplaintsSection
          loading={loading}
          filtered={filtered}
          filter={filter}
          setFilter={setFilter}
          resolveMediaUrl={resolveMediaUrl}
          statusOptions={statusOptions}
          statusColor={statusColor}
          fetchComplaints={fetchComplaints}
          handleStatus={handleStatus}
          handleDelete={handleDelete}
          handleDownloadEvidence={handleDownloadEvidence}
          handleExportComplaints={handleExportComplaints}
          setSelectedComplaint={setSelectedComplaint}
          error={error}
          successMessage={successMessage}
        />
      );
    }

    return null;
  };

  return (
    <div className="student-shell">
      <div className="student-main">
        <header className="student-header admin-header">
          <button
            className="mobile-menu-button"
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Buka menu admin"
            title="Buka menu"
          >
            <Menu size={21} strokeWidth={2.5} />
          </button>
          <div className="brand-inline admin-brand">
            <img className="brand-logo" src="/logo-sma.jpg" alt="SMA Logo" />
            <div className="brand-text">
              <p className="muted small">SMA Negeri 1</p>
              <strong className="title">Bangunrejo</strong>
            </div>
          </div>
          <div className="header-actions">
            <div className="user-chip admin-user-chip">
              <div>
                <strong>{user?.name}</strong>
                <p className="muted small">Admin</p>
              </div>
            </div>
            <button className="ghost" type="button" onClick={logout}>
              Keluar
            </button>
          </div>
          <div className="mobile-user-summary admin-mobile-user-summary" aria-label="Profil admin">
            <span>Admin</span>
            <div className="avatar sm">AD</div>
          </div>
        </header>

        <button
          className={isMobileNavOpen ? "mobile-nav-overlay is-open" : "mobile-nav-overlay"}
          type="button"
          onClick={closeMobileNav}
          aria-label="Tutup menu admin"
          tabIndex={isMobileNavOpen ? 0 : -1}
        />

        <aside
          className={isMobileNavOpen ? "mobile-drawer admin-mobile-drawer is-open" : "mobile-drawer admin-mobile-drawer"}
          aria-hidden={!isMobileNavOpen}
        >
          <div className="mobile-drawer-head">
            <div className="mobile-drawer-brand">
              <img className="brand-logo" src="/logo-sma.jpg" alt="SMA Logo" />
              <div>
                <p className="muted small">Panel admin</p>
                <strong>SMA Negeri 1 Bangunrejo</strong>
              </div>
            </div>
            <button
              className="mobile-drawer-close"
              type="button"
              onClick={closeMobileNav}
              aria-label="Tutup menu"
              title="Tutup menu"
            >
              <X size={19} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mobile-drawer-profile">
            <div className="avatar rail-avatar">AD</div>
            <div>
              <p className="muted small">Admin</p>
              <strong>{user?.name}</strong>
              <span>Pengelola laporan sekolah</span>
            </div>
          </div>

          <div className="mobile-drawer-stats">
            <div>
              <span>Akun baru</span>
              <strong>{pendingAccountRequests.length}</strong>
            </div>
            <div>
              <span>Diproses</span>
              <strong>{complaintStats.inProgress}</strong>
            </div>
            <div>
              <span>Pengaduan</span>
              <strong>{complaintStats.total}</strong>
            </div>
          </div>

          <nav className="mobile-drawer-menu" aria-label="Navigasi admin">
            {mobileAdminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={adminView === item.value ? "mobile-drawer-link active" : "mobile-drawer-link"}
                  onClick={() => handleMobileAdminSelect(item.value)}
                >
                  <Icon size={18} strokeWidth={2.35} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button className="mobile-drawer-logout" type="button" onClick={logout}>
            <LogOut size={18} strokeWidth={2.35} />
            <span>Keluar</span>
          </button>
        </aside>

        <main className="student-content admin-content">
          <section className="workspace-layout admin-workspace-layout">
            <AdminSidebar
              user={user}
              adminView={adminView}
              setAdminView={setAdminView}
              navItems={adminNavItems}
              pendingCount={pendingAccountRequests.length}
              inProgressCount={complaintStats.inProgress}
              complaintTotal={complaintStats.total}
            />

            <div className="workspace-main admin-workspace-main">
              <section className="welcome-card admin-welcome-card">
                <div>
                  <h2>{currentView.label}</h2>
                  <p className="muted">{currentView.description}</p>
                </div>
              </section>

              <section className="admin-switcher">
                {adminNavItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={adminView === item.value ? "admin-nav-btn active" : "admin-nav-btn"}
                    onClick={() => setAdminView(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </section>

              {renderView()}
            </div>
          </section>
        </main>

        <nav className="mobile-bottom-nav admin-mobile-bottom-nav" aria-label="Navigasi utama admin">
          {mobileAdminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                className={adminView === item.value ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"}
                onClick={() => handleMobileAdminSelect(item.value)}
              >
                <Icon size={19} strokeWidth={2.4} />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        <ComplaintDetailModal
          role="admin"
          selectedComplaintDetail={selectedComplaintDetail}
          statusOptions={statusOptions}
          statusColor={statusColor}
          resolveMediaUrl={resolveMediaUrl}
          handleDownloadEvidence={handleDownloadEvidence}
          onClose={() => setSelectedComplaint(null)}
        />
      </div>
    </div>
  );
};

export default AdminPage;
