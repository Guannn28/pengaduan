import { formatDate, getStatusLabel } from "../../utils/formatters";
import DatasetInsightSection from "./DatasetInsightSection";

const AdminStatCard = ({ label, value, helper, tone = "default" }) => (
  <div className={`admin-stat-card ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    {helper && <p>{helper}</p>}
  </div>
);

const AdminDashboard = ({
  complaintStats,
  pendingAccountRequests,
  studentAccounts,
  recentComplaints,
  statusOptions,
  statusColor,
  setAdminView,
  setSelectedComplaint,
  handleUseAccountRequest,
  localizedInsight,
  datasetInsightLoading,
  datasetInsightError,
  showDatasetInsightDetail,
  setShowDatasetInsightDetail,
}) => (
  <>
    <section className="admin-stat-grid">
      <AdminStatCard
        label="Total Pengaduan"
        value={complaintStats.total}
        helper="Semua laporan masuk"
      />
      <AdminStatCard
        label="Diajukan"
        value={complaintStats.submitted}
        helper="Menunggu ditinjau"
        tone="warning"
      />
      <AdminStatCard
        label="Diproses"
        value={complaintStats.inProgress}
        helper="Sedang ditindaklanjuti"
        tone="info"
      />
      <AdminStatCard
        label="Selesai"
        value={complaintStats.resolved}
        helper="Sudah ditutup"
        tone="success"
      />
      <AdminStatCard
        label="Pengajuan Akun Baru"
        value={pendingAccountRequests.length}
        helper="Perlu diproses admin"
        tone="account"
      />
      <AdminStatCard
        label="Akun Siswa Aktif"
        value={studentAccounts.length}
        helper="Akun siswa yang bisa login"
        tone="student"
      />
    </section>

    <section className="dashboard-overview-grid">
      <div className="card dashboard-list-card">
        <div className="card-head">
          <div>
            <h3>Pengaduan Terbaru</h3>
            <p className="muted small">Laporan terakhir yang masuk ke sistem.</p>
          </div>
          <button className="ghost" type="button" onClick={() => setAdminView("complaints")}>
            Buka Pengaduan
          </button>
        </div>
        {recentComplaints.length === 0 ? (
          <div className="empty compact-empty">Belum ada pengaduan yang masuk.</div>
        ) : (
          <div className="dashboard-list">
            {recentComplaints.map((complaint) => (
              <div key={complaint.id} className="dashboard-list-item">
                <div>
                  <strong>{complaint.category || "Pengaduan"}</strong>
                  <p className="muted small">
                    {complaint.name || "Pelapor"} - {formatDate(complaint.createdAt)}
                  </p>
                </div>
                <div className="dashboard-list-actions">
                  <span className={statusColor[complaint.status] || "badge"}>
                    {getStatusLabel(statusOptions, complaint.status)}
                  </span>
                  <button
                    className="ghost small-btn"
                    type="button"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    Lihat detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card dashboard-list-card">
        <div className="card-head">
          <div>
            <h3>Tugas Akun</h3>
            <p className="muted small">Pengajuan akun yang perlu dilanjutkan.</p>
          </div>
          <button
            className="ghost"
            type="button"
            onClick={() => setAdminView("account-requests")}
          >
            Buka Pengajuan
          </button>
        </div>
        {pendingAccountRequests.length === 0 ? (
          <div className="empty compact-empty">Belum ada pengajuan akun baru.</div>
        ) : (
          <div className="dashboard-list">
            {pendingAccountRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="dashboard-list-item">
                <div>
                  <strong>{request.name}</strong>
                  <p className="muted small">
                    {request.username || "-"} - {request.className || "Kelas belum diisi"}
                  </p>
                </div>
                <button
                  className="ghost small-btn"
                  type="button"
                  onClick={() => {
                    handleUseAccountRequest(request);
                    setAdminView("account-requests");
                  }}
                >
                  Siapkan Akun
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>

    <DatasetInsightSection
      localizedInsight={localizedInsight}
      datasetInsightLoading={datasetInsightLoading}
      datasetInsightError={datasetInsightError}
      showDatasetInsightDetail={showDatasetInsightDetail}
      setShowDatasetInsightDetail={setShowDatasetInsightDetail}
    />
  </>
);

export default AdminDashboard;
