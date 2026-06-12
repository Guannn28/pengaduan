import { useMemo, useState } from "react";
import AccountRequestsSection from "../components/admin/AccountRequestsSection";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminSidebar from "../components/admin/AdminSidebar";
import ComplaintsSection from "../components/admin/ComplaintsSection";
import ComplaintDetailModal from "../components/admin/ComplaintDetailModal";
import DatasetInsightSection from "../components/admin/DatasetInsightSection";
import StudentAccountsSection from "../components/admin/StudentAccountsSection";
import {
  adminNavItems,
  complaintDetailLabels,
  normalizeDatasetItems,
  splitComplaintMessage,
} from "../components/admin/adminUtils";

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
  datasetInsight,
  datasetInsightLoading,
  datasetInsightError,
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
  const [showDatasetInsightDetail, setShowDatasetInsightDetail] = useState(false);

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

  const localizedInsight = datasetInsight
    ? {
        ...datasetInsight,
        distributions: {
          age: normalizeDatasetItems(datasetInsight.distributions?.age),
          sex: normalizeDatasetItems(datasetInsight.distributions?.sex),
          feltLonely: normalizeDatasetItems(datasetInsight.distributions?.feltLonely),
          missSchool: normalizeDatasetItems(datasetInsight.distributions?.missSchool),
        },
      }
    : null;

  const selectedComplaintDetail = useMemo(() => {
    if (!selectedComplaint) {
      return null;
    }

    const parsed = splitComplaintMessage(selectedComplaint.message);
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
  const recentComplaints = complaints.slice(0, 5);

  const datasetInsightSection = (
    <DatasetInsightSection
      localizedInsight={localizedInsight}
      datasetInsightLoading={datasetInsightLoading}
      datasetInsightError={datasetInsightError}
      showDatasetInsightDetail={showDatasetInsightDetail}
      setShowDatasetInsightDetail={setShowDatasetInsightDetail}
    />
  );

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
          localizedInsight={localizedInsight}
          datasetInsightLoading={datasetInsightLoading}
          datasetInsightError={datasetInsightError}
          showDatasetInsightDetail={showDatasetInsightDetail}
          setShowDatasetInsightDetail={setShowDatasetInsightDetail}
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
          setSelectedComplaint={setSelectedComplaint}
          error={error}
          successMessage={successMessage}
        />
      );
    }

    if (adminView === "insight") {
      return datasetInsightSection;
    }

    return null;
  };

  return (
    <div className="student-shell">
      <div className="student-main">
        <header className="student-header admin-header">
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

        <ComplaintDetailModal
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
