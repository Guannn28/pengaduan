import { formatDate, getStatusLabel } from "../../utils/formatters";
import DatasetInsightSection from "./DatasetInsightSection";
import {
  BarChart2,
  Clock,
  RefreshCw,
  CheckCircle2,
  UserPlus,
  Users,
  Inbox,
  ClipboardList,
  PartyPopper,
} from "lucide-react";

/**
 * AdminStatCard — Kartu statistik cepat untuk Admin Dashboard.
 *
 * Setiap kartu menampilkan satu metrik utama dengan:
 * - Ikon Lucide React di kanan atas
 * - Angka besar di tengah
 * - Label dan deskripsi singkat
 * - Garis warna di sisi kiri (via CSS `::after`) sesuai `tone`
 *
 * @param {string}  label   - Label singkat di atas angka
 * @param {number}  value   - Nilai/angka yang ditampilkan
 * @param {string}  helper  - Deskripsi singkat di bawah angka
 * @param {React.ReactNode} icon - Komponen ikon Lucide
 * @param {string}  tone    - Tema warna kartu
 */
const AdminStatCard = ({ label, value, helper, icon, tone = "default" }) => (
  <div className={`admin-stat-card ${tone}`}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span>{label}</span>
      {icon && (
        <span style={{ opacity: 0.5, color: "var(--text-secondary)" }}>
          {icon}
        </span>
      )}
    </div>
    <strong>{value}</strong>
    {helper && <p>{helper}</p>}
  </div>
);

/**
 * AdminDashboard — Halaman ringkasan utama panel Admin.
 *
 * Menampilkan:
 * 1. Enam kartu statistik cepat berdasarkan status pengaduan
 * 2. Dua kolom: Pengaduan Terbaru dan Tugas Pengajuan Akun
 * 3. Bagian Dataset Insight dari file Bullying_2018.csv
 */
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
    {/* ——— Statistik Cepat ——— */}
    <section className="admin-stat-grid">
      <AdminStatCard
        label="Total Pengaduan"
        value={complaintStats.total}
        helper="Semua laporan yang masuk"
        icon={<BarChart2 size={20} strokeWidth={1.5} />}
      />
      <AdminStatCard
        label="Menunggu Ditinjau"
        value={complaintStats.submitted}
        helper="Perlu tindakan segera"
        icon={<Clock size={20} strokeWidth={1.5} />}
        tone="warning"
      />
      <AdminStatCard
        label="Sedang Diproses"
        value={complaintStats.inProgress}
        helper="Sedang ditindaklanjuti"
        icon={<RefreshCw size={20} strokeWidth={1.5} />}
        tone="info"
      />
      <AdminStatCard
        label="Selesai"
        value={complaintStats.resolved}
        helper="Telah diselesaikan"
        icon={<CheckCircle2 size={20} strokeWidth={1.5} />}
        tone="success"
      />
      <AdminStatCard
        label="Pengajuan Akun"
        value={pendingAccountRequests.length}
        helper="Menunggu persetujuan"
        icon={<UserPlus size={20} strokeWidth={1.5} />}
        tone="account"
      />
      <AdminStatCard
        label="Akun Siswa Aktif"
        value={studentAccounts.length}
        helper="Siswa yang dapat masuk sistem"
        icon={<Users size={20} strokeWidth={1.5} />}
        tone="student"
      />
    </section>

    {/* ——— Dua kolom: Pengaduan Terbaru & Tugas Akun ——— */}
    <section className="dashboard-overview-grid">
      {/* Pengaduan Terbaru */}
      <div className="card dashboard-list-card">
        <div className="card-head">
          <div>
            <h3>Pengaduan Terbaru</h3>
            <p className="muted small">Lima laporan terakhir yang masuk ke sistem.</p>
          </div>
          <button className="ghost" type="button" onClick={() => setAdminView("complaints")}>
            Lihat Semua
          </button>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 24px" }}>
            <div className="empty-state-icon">
              <Inbox size={48} strokeWidth={1} color="var(--text-muted)" />
            </div>
            <h4>Belum ada pengaduan</h4>
            <p>Laporan dari siswa akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          <div className="dashboard-list">
            {recentComplaints.map((complaint) => (
              <div key={complaint.id} className="dashboard-list-item">
                <div style={{ minWidth: 0 }}>
                  <strong>{complaint.category || "Pengaduan"}</strong>
                  <p className="muted small">
                    {complaint.name || "Pelapor"} &middot; {formatDate(complaint.createdAt)}
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
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tugas Pengajuan Akun */}
      <div className="card dashboard-list-card">
        <div className="card-head">
          <div>
            <h3>Tugas Pengajuan Akun</h3>
            <p className="muted small">Daftar pengajuan akun siswa yang perlu ditindaklanjuti.</p>
          </div>
          <button
            className="ghost"
            type="button"
            onClick={() => setAdminView("account-requests")}
          >
            Lihat Semua
          </button>
        </div>

        {pendingAccountRequests.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 24px" }}>
            <div className="empty-state-icon">
              <ClipboardList size={48} strokeWidth={1} color="var(--text-muted)" />
            </div>
            <h4>Tidak ada tugas tertunda</h4>
            <p>Semua pengajuan akun telah diproses.</p>
          </div>
        ) : (
          <div className="dashboard-list">
            {pendingAccountRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="dashboard-list-item">
                <div style={{ minWidth: 0 }}>
                  <strong>{request.name}</strong>
                  <p className="muted small">
                    @{request.username || "-"} &middot; {request.className || "Kelas belum diisi"}
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
                  Buat Akun
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* ——— Dataset Insight ——— */}
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
