import { useMemo, useState } from "react";
import { FileText, MessageSquare } from "lucide-react";
import AssistantComplaintCard from "../components/student/AssistantComplaintCard";
import ComplaintDetailModal from "../components/shared/ComplaintDetailModal";
import StudentComplaintList from "../components/student/StudentComplaintList";
import StudentHeader from "../components/student/StudentHeader";
import { BottomNavigation } from "../components/shared/ui";
import { parseComplaintMessage } from "../utils/formatters";

const studentMobileNavItems = [
  { value: "chatbot", label: "Buat Pengaduan", shortLabel: "Buat Pengaduan", icon: MessageSquare },
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
  const [studentMobileView, setStudentMobileView] = useState("chatbot");
  const initials = (user?.name || user?.username || "M").substring(0, 2).toUpperCase();

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

  const showStudentMobileView = (view) => {
    setStudentMobileView(view);

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
          logout={logout}
        />

        <main className="student-content" data-mobile-view={studentMobileView}>
          <section className="workspace-layout student-workspace-layout">
            <div className="workspace-main">
              <section className="student-grid">
                <section className="student-section-anchor student-mobile-section student-history-section" data-mobile-section="history">
                  <StudentComplaintList
                    loading={loading}
                    complaints={complaints}
                    filtered={filtered}
                    filter={filter}
                    setFilter={setFilter}
                    statusOptions={statusOptions}
                    statusColor={statusColor}
                    fetchComplaints={fetchComplaints}
                    onOpenDetail={setSelectedComplaint}
                    onCreateFirst={() => showStudentMobileView("chatbot")}
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

        <BottomNavigation
          items={studentMobileNavItems}
          activeValue={studentMobileView}
          onSelect={showStudentMobileView}
          ariaLabel="Navigasi utama siswa"
          className="student-mobile-bottom-nav"
        />

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
