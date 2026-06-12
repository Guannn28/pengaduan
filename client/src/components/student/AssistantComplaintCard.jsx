import FinalReportSummary from "./FinalReportSummary";

const AssistantComplaintCard = ({
  error,
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
}) => (
  <div className="card submit-card assistant-card">
    <div className="compose-head">
      <div>
        <h3>Buat Pengaduan</h3>
        <p className="muted small">
          Ceritakan kejadian yang ingin Anda laporkan. Sistem akan membantu menyusun laporan secara
          bertahap.
        </p>
      </div>
      <span className="compose-badge">Asisten Pengaduan</span>
    </div>
    {error && <div className="alert">{error}</div>}
    <div className="chat-panel">
      <div className="chat-panel-head">
        <div className="chat-panel-identity">
          <div className="chat-panel-avatar">AP</div>
          <div>
            <strong>Asisten Pengaduan</strong>
            <p className="muted small">Siap membantu menyusun laporan</p>
          </div>
        </div>
      </div>
      <div className="chat-window" aria-live="polite">
        {chatMessages.map((message, index) => (
          <div
            key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
            className={`chat-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
          >
            {message.role !== "user" && <div className="chat-avatar-dot">AP</div>}
            <div className="chat-bubble">{message.content}</div>
          </div>
        ))}
        {chatLoading && (
          <div className="chat-row is-assistant">
            <div className="chat-avatar-dot">AP</div>
            <div className="chat-bubble typing">Sedang menyiapkan pertanyaan berikutnya...</div>
          </div>
        )}
      </div>
    </div>

    <div className="chat-compose">
      <textarea
        rows="3"
        value={chatInput}
        onChange={(event) => setChatInput(event.target.value)}
        placeholder="Tulis jawaban Anda di sini..."
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleChatSend();
          }
        }}
      />
      <div className="form-actions">
        <button type="button" onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()}>
          {chatLoading ? "Mengirim..." : "Kirim"}
        </button>
      </div>
    </div>

    {chatFinalData && (
      <FinalReportSummary
        chatFinalData={chatFinalData}
        chatEvidence={chatEvidence}
        setChatEvidence={setChatEvidence}
        chatEvidenceInputKey={chatEvidenceInputKey}
        chatSubmitting={chatSubmitting}
        handleChatSubmitComplaint={handleChatSubmitComplaint}
      />
    )}
  </div>
);

export default AssistantComplaintCard;
