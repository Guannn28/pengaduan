import { useEffect, useRef } from "react";
import { Send, MessageSquare, Paperclip, X, Loader2 } from "lucide-react";
import FinalReportSummary from "./FinalReportSummary";
const TypingBubble = () => (
  <div className="chat-row is-assistant">
    <div className="chat-avatar-dot">AP</div>
    <div className="chat-bubble typing">
      <div className="typing-dots">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  </div>
);
const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const AssistantComplaintCard = ({
  error,
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
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  const onFileSelected = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      handleChatAttach(file);
    }
    event.target.value = "";
  };

  return (
    <div className="card submit-card assistant-card">
      <div className="compose-head">
        <div>
          <h3>Buat Pengaduan</h3>
          <p className="muted small">
            Ceritakan kejadian secara singkat. Asisten akan membantu menyusun laporan secara bertahap.
          </p>
        </div>
        <span className="compose-badge">
          <MessageSquare size={13} strokeWidth={2.5} />
          Asisten Pengaduan
        </span>
      </div>

      {error && <div className="alert">{error}</div>}
      <div className="chat-panel">
        <div className="chat-panel-head">
          <div className="chat-panel-identity">
            <div className="chat-panel-avatar">AP</div>
            <div>
              <strong>Asisten Pengaduan</strong>
              <p className="muted small chat-panel-subtitle">Siap membantu menyusun laporan</p>
            </div>
          </div>
        </div>
        <div className="chat-window" aria-live="polite">
          {chatMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
              className={`chat-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
            >
              {message.role !== "user" && (
                <div className="chat-avatar-dot">AP</div>
              )}
              <div className="chat-bubble">{message.content}</div>
            </div>
          ))}

          {chatLoading && <TypingBubble />}
          <div ref={chatBottomRef} />
        </div>
      </div>
      {chatAttachment && (
        <div className="chat-attach-preview">
          <div className="chat-attach-preview-info">
            <Paperclip size={14} strokeWidth={2} />
            <span className="chat-attach-name">{chatAttachment.name}</span>
            <span className="chat-attach-size">{formatFileSize(chatAttachment.size)}</span>
            {chatAttachUploading && (
              <Loader2 className="inline-spinner" size={14} strokeWidth={2.5} />
            )}
            {!chatAttachUploading && chatUploadedEvidence?.evidenceUrl && (
              <span className="chat-attach-status">Terupload</span>
            )}
            {!chatAttachUploading && !chatUploadedEvidence?.evidenceUrl && (
              <span className="chat-attach-status is-pending">Dipilih</span>
            )}
          </div>
          <button
            type="button"
            className="chat-attach-remove-btn"
            onClick={handleChatRemoveAttachment}
            title="Hapus lampiran"
            disabled={chatAttachUploading}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}
      <div className="chat-compose">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={onFileSelected}
          className="visually-hidden-file-input"
        />

        <textarea
          rows="3"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Tulis jawaban Anda di sini... (Enter untuk mengirim)"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleChatSend();
            }
          }}
          disabled={chatLoading}
        />
        <div className="form-actions chat-compose-actions">
          <button
            type="button"
            className="chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={chatLoading || chatAttachUploading}
            title="Lampirkan foto bukti"
          >
            <Paperclip size={15} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleChatSend}
            disabled={chatLoading || chatAttachUploading || !chatInput.trim()}
            title="Kirim pesan (Enter)"
          >
            <Send size={15} strokeWidth={2.5} />
            {chatLoading ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </div>
      {chatFinalData && (
        <FinalReportSummary
          chatFinalData={chatFinalData}
          chatSubmitting={chatSubmitting}
          handleChatSubmitComplaint={handleChatSubmitComplaint}
          chatAttachment={chatAttachment}
          chatUploadedEvidence={chatUploadedEvidence}
          chatAttachUploading={chatAttachUploading}
          handleChatAttach={handleChatAttach}
          handleChatRemoveAttachment={handleChatRemoveAttachment}
        />
      )}
    </div>
  );
};

export default AssistantComplaintCard;
