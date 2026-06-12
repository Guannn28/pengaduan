import { useMemo, useState } from "react";
import AssistantComplaintCard from "./student/AssistantComplaintCard";
import StudentComplaintDetailModal from "./student/StudentComplaintDetailModal";
import StudentComplaintList from "./student/StudentComplaintList";
import StudentHeader from "./student/StudentHeader";
import StudentOverviewRail from "./student/StudentOverviewRail";
import { parseComplaintMessage } from "./student/studentUtils";

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
  chatEvidence,
  setChatEvidence,
  chatEvidenceInputKey,
  chatSubmitting,
  handleChatSend,
  handleChatSubmitComplaint,
}) => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const initials = (user?.name || user?.username || "M").substring(0, 2).toUpperCase();
  const progressCount = complaints.filter((complaint) => complaint.status === "in_progress").length;
  const resolvedCount = complaints.filter((complaint) => complaint.status === "resolved").length;
  const totalCount = complaints.length;

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

  return (
    <div className="student-shell">
      <div className="student-main">
        <StudentHeader
          user={user}
          initials={initials}
          fetchComplaints={fetchComplaints}
          logout={logout}
        />

        <main className="student-content">
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
              <section className="welcome-card">
                <div>
                  <p className="muted small">Dashboard Pengaduan</p>
                  <h2>Laporkan masalah tanpa ribet</h2>
                  <p className="muted">
                    Kirim laporan dengan bukti, lalu pantau status penanganannya dari halaman ini.
                  </p>
                </div>
              </section>

              <section className="student-grid">
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

                <AssistantComplaintCard
                  error={error}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatLoading={chatLoading}
                  chatFinalData={chatFinalData}
                  chatEvidence={chatEvidence}
                  setChatEvidence={setChatEvidence}
                  chatEvidenceInputKey={chatEvidenceInputKey}
                  chatSubmitting={chatSubmitting}
                  handleChatSend={handleChatSend}
                  handleChatSubmitComplaint={handleChatSubmitComplaint}
                />
              </section>
            </div>
          </section>
        </main>

        <StudentComplaintDetailModal
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
