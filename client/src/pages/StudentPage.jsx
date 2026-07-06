import { useEffect, useMemo, useState } from "react";
import { FileText, Home, LogOut, MessageSquare, RefreshCw, X } from "lucide-react";
import AssistantComplaintCard from "../components/student/AssistantComplaintCard";
import ComplaintDetailModal from "../components/shared/ComplaintDetailModal";
import StudentComplaintList from "../components/student/StudentComplaintList";
import StudentHeader from "../components/student/StudentHeader";
import StudentOverviewRail from "../components/student/StudentOverviewRail";
import { parseComplaintMessage } from "../utils/formatters";

const studentMobileNavItems = [
  { value: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: Home },
  { value: "chatbot", label: "Chatbot / Buat Pengaduan", shortLabel: "Chatbot", icon: MessageSquare },
  { value: "history", label: "Riwayat Pengaduan", shortLabel: "Riwayat", icon: FileText },
];

const StudentPage = ({
  user,
  resolveMediaUrl,
  logout,
  error,
  loading,
  complaints = [],
  filtered = [],
  filter,
  setFilter,
  statusOptions,
  statusColor,
  fetchComplaints,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  chatFinalData,
  chatSubmitting,
  handleChatSend,
  handleChatSubmitComplaint,
  chatAttachment,
  chatUploadedEvidence,
  chatAttachUploading,
  handleChatAttach,
  handleChatRemoveAttachment,
}) => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [studentMobileView, setStudentMobileView] = useState("dashboard");
  const initials = (user?.name || user?.username || "M").substring(0, 2).toUpperCase();
  const progressCount = complaints.filter((complaint) => complaint.status === "in_progress").length;
  const resolvedCount = complaints.filter((complaint) => complaint.status === "resolved").length;
  const totalCount = complaints.length;

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

  const selectedComplaintDetail = useMemo(() => {
    if (!selectedComplaint) {
      return null;
    }

    const parsed = parseComplaintMessage(selectedComplaint.message);
    return {
      ...selectedComplaint,
      rawMessage: parsed.raw,
      parsedFields: parsed.fields,
    };
  }, [selectedComplaint]);

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const showStudentMobileView = (view) => {
    setStudentMobileView(view);
    closeMobileNav();

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div className="student-shell">
      <div className="student-main">
        <StudentHeader
          user={user}
          initials={initials}
          fetchComplaints={fetchComplaints}
          logout={logout}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        <button
          className={isMobileNavOpen ? "mobile-nav-overlay is-open" : "mobile-nav-overlay"}
          type="button"
          onClick={closeMobileNav}
          aria-label="Tutup menu navigasi"
          tabIndex={isMobileNavOpen ? 0 : -1}
        />

        <aside
          className={isMobileNavOpen ? "mobile-drawer student-mobile-drawer is-open" : "mobile-drawer student-mobile-drawer"}
          aria-hidden={!isMobileNavOpen}
        >
          <div className="mobile-drawer-head">
            <div className="mobile-drawer-brand">
              <img className="brand-logo" src="/logo-sma.jpg" alt="SMA Logo" />
              <div>
                <p className="muted small">SMA Negeri 1</p>
                <strong>Bangunrejo</strong>
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
            <div className="avatar rail-avatar">{initials}</div>
            <div>
              <p className="muted small">Akun siswa</p>
              <strong>{user?.name}</strong>
              <span>{user?.className || "Kelas belum diisi"}</span>
            </div>
          </div>

          <div className="mobile-drawer-stats">
            <div>
              <span>Total</span>
              <strong>{totalCount}</strong>
            </div>
            <div>
              <span>Diproses</span>
              <strong>{progressCount}</strong>
            </div>
            <div>
              <span>Selesai</span>
              <strong>{resolvedCount}</strong>
            </div>
          </div>

          <nav className="mobile-drawer-menu" aria-label="Navigasi siswa">
            {studentMobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={studentMobileView === item.value ? "mobile-drawer-link active" : "mobile-drawer-link"}
                  onClick={() => showStudentMobileView(item.value)}
                >
                  <Icon size={18} strokeWidth={2.35} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="mobile-drawer-link"
              onClick={() => {
                fetchComplaints();
                closeMobileNav();
              }}
            >
              <RefreshCw size={18} strokeWidth={2.35} />
              <span>Muat ulang data</span>
            </button>
          </nav>

          <button className="mobile-drawer-logout" type="button" onClick={logout}>
            <LogOut size={18} strokeWidth={2.35} />
            <span>Keluar</span>
          </button>
        </aside>

        <main className="student-content" data-mobile-view={studentMobileView}>
          <section className="workspace-layout">
            <StudentOverviewRail
              user={user}
              initials={initials}
              totalCount={totalCount}
              progressCount={progressCount}
              resolvedCount={resolvedCount}
              fetchComplaints={fetchComplaints}
            />

            <div className="workspace-main">
              <section className="welcome-card mobile-section-anchor student-mobile-section student-dashboard-section" data-mobile-section="dashboard">
                <div>
                  <p className="muted small">Dashboard Pengaduan</p>
                  <h2>Laporkan masalah tanpa ribet</h2>
                  <p className="muted">
                    Kirim laporan dengan bukti, lalu pantau status penanganannya dari halaman ini.
                  </p>
                </div>
                <div className="student-mobile-dashboard-summary" aria-label="Ringkasan pengaduan siswa">
                  <div>
                    <span>Total</span>
                    <strong>{totalCount}</strong>
                  </div>
                  <div>
                    <span>Diproses</span>
                    <strong>{progressCount}</strong>
                  </div>
                  <div>
                    <span>Selesai</span>
                    <strong>{resolvedCount}</strong>
                  </div>
                  <button className="ghost student-mobile-refresh" type="button" onClick={() => fetchComplaints()}>
                    <RefreshCw size={14} strokeWidth={2.5} />
                    Muat ulang data
                  </button>
                </div>
              </section>

              <section className="student-grid">
                <section className="student-section-anchor student-mobile-section student-history-section" data-mobile-section="history">
                  <StudentComplaintList
                    loading={loading}
                    filtered={filtered}
                    filter={filter}
                    setFilter={setFilter}
                    statusOptions={statusOptions}
                    statusColor={statusColor}
                    fetchComplaints={fetchComplaints}
                    resolveMediaUrl={resolveMediaUrl}
                    onOpenDetail={setSelectedComplaint}
                  />
                </section>

                <section className="student-section-anchor student-mobile-section student-chatbot-section" data-mobile-section="chatbot">
                  <AssistantComplaintCard
                    error={error}
                    chatMessages={chatMessages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    chatLoading={chatLoading}
                    chatFinalData={chatFinalData}
                    chatSubmitting={chatSubmitting}
                    handleChatSend={handleChatSend}
                    handleChatSubmitComplaint={handleChatSubmitComplaint}
                    chatAttachment={chatAttachment}
                    chatUploadedEvidence={chatUploadedEvidence}
                    chatAttachUploading={chatAttachUploading}
                    handleChatAttach={handleChatAttach}
                    handleChatRemoveAttachment={handleChatRemoveAttachment}
                  />
                </section>
              </section>
            </div>
          </section>
        </main>

        <nav className="mobile-bottom-nav student-mobile-bottom-nav" aria-label="Navigasi utama siswa">
          {studentMobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                className={studentMobileView === item.value ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"}
                onClick={() => showStudentMobileView(item.value)}
              >
                <Icon size={19} strokeWidth={2.4} />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        <ComplaintDetailModal
          role="student"
          selectedComplaintDetail={selectedComplaintDetail}
          statusOptions={statusOptions}
          statusColor={statusColor}
          resolveMediaUrl={resolveMediaUrl}
          onClose={() => setSelectedComplaint(null)}
        />
      </div>
    </div>
  );
};

export default StudentPage;
