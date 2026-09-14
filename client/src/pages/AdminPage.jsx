import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, FileText, Home, LogOut, UserPlus, Users } from "lucide-react";
import AccountRequestsSection from "../components/admin/AccountRequestsSection";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminSidebar from "../components/admin/AdminSidebar";
import ComplaintsSection from "../components/admin/ComplaintsSection";
import ComplaintDetailModal from "../components/shared/ComplaintDetailModal";
import { BottomNavigation } from "../components/shared/ui";
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
  accountRequestsLoading,
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

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
    if (!isProfileOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleMobileAdminSelect = (view) => {
    setAdminView(view);
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
          accountRequestsLoading={accountRequestsLoading}
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
          <div className="brand-inline admin-brand">
            <img className="brand-logo" src="/logo-sma.jpg" alt="Logo SMA Negeri 1 Bangunrejo" />
            <div className="brand-text">
              <p className="muted small">SMA Negeri 1</p>
              <strong className="title">Bangunrejo</strong>
            </div>
          </div>
          <div className="header-actions profile-menu-wrap" ref={profileMenuRef}>
            <button className="profile-menu-trigger" type="button" onClick={() => setIsProfileOpen((value) => !value)} aria-expanded={isProfileOpen} aria-haspopup="menu" aria-label="Buka menu akun admin">
              <span className="avatar sm">AD</span><span className="profile-menu-trigger-copy"><strong>{user?.name}</strong><small>Admin sekolah</small></span><ChevronDown size={17} aria-hidden="true" />
            </button>
            {isProfileOpen && <div className="profile-menu" role="menu" aria-label="Menu akun admin"><div><strong>Admin Sekolah</strong><span>Admin / Administrator</span></div><button type="button" role="menuitem" onClick={logout}><LogOut size={17} /> Keluar</button></div>}
          </div>
        </header>

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
              <nav className="admin-switcher" aria-label="Navigasi admin untuk tablet">
                {adminNavItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={adminView === item.value ? "admin-nav-btn active" : "admin-nav-btn"}
                    onClick={() => setAdminView(item.value)}
                    aria-current={adminView === item.value ? "page" : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <section className="welcome-card admin-welcome-card page-header">
                <div>
                  <p className="section-eyebrow">Panel administrasi</p>
                  <h1>{currentView.label}</h1>
                  <p className="muted">{currentView.description}</p>
                </div>
              </section>

              {renderView()}
            </div>
          </section>
        </main>

        <BottomNavigation
          items={mobileAdminNavItems}
          activeValue={adminView}
          onSelect={handleMobileAdminSelect}
          ariaLabel="Navigasi utama admin"
          className="admin-mobile-bottom-nav"
        />

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
