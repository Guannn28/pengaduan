import { useEffect, useRef } from "react";
import { Send, MessageSquare, Paperclip, X, Loader2 } from "lucide-react";
import FinalReportSummary from "./FinalReportSummary";

/**
 * Komponen bubble typing animation — indikator asisten sedang memproses
 * respons berikutnya (animasi tiga titik berdenyut).
 */
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

/**
 * Format ukuran file menjadi string yang mudah dibaca.
 */
const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * AssistantComplaintCard — Antarmuka percakapan humanis untuk pengisian laporan.
 * Meniru tampilan aplikasi pesan modern: bubble warna berbeda antara
 * pesan asisten (putih) dan pesan siswa (hijau muda), dengan auto-scroll
 * ke pesan terbaru setiap kali percakapan berlanjut.
 */
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
  chatAttachment,
  chatUploadedEvidence,
  chatAttachUploading,
  handleChatAttach,
  handleChatRemoveAttachment,
}) => {
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll ke pesan terbaru setiap kali daftar pesan berubah
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
    // Reset input agar file yang sama bisa dipilih lagi
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
          <MessageSquare size={13} strokeWidth={2.5} style={{ marginRight: "5px" }} />
          Asisten Pengaduan
        </span>
      </div>

      {error && <div className="alert">{error}</div>}

      {/* Chat Panel */}
      <div className="chat-panel">
        <div className="chat-panel-head">
          <div className="chat-panel-identity">
            <div className="chat-panel-avatar">AP</div>
            <div>
              <strong>Asisten Pengaduan</strong>
              <p className="muted small" style={{ color: "rgba(255,255,255,0.8)" }}>Siap membantu menyusun laporan</p>
            </div>
          </div>
        </div>

        {/* Jendela chat dengan scroll */}
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

          {/* Anchor untuk auto-scroll */}
          <div ref={chatBottomRef} />
        </div>
      </div>

      {/* Preview lampiran di atas area komposisi */}
      {chatAttachment && (
        <div className="chat-attach-preview">
          <div className="chat-attach-preview-info">
            <Paperclip size={14} strokeWidth={2} />
            <span className="chat-attach-name">{chatAttachment.name}</span>
            <span className="chat-attach-size">{formatFileSize(chatAttachment.size)}</span>
            {chatAttachUploading && (
              <Loader2 size={14} strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} />
            )}
            {!chatAttachUploading && chatUploadedEvidence && (
              <span className="chat-attach-status">✓ Terupload</span>
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

      {/* Area komposisi pesan */}
      <div className="chat-compose">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={onFileSelected}
          style={{ display: "none" }}
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
        <div className="form-actions" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
            disabled={chatLoading || !chatInput.trim()}
            title="Kirim pesan (Enter)"
            style={{ gap: "8px" }}
          >
            <Send size={15} strokeWidth={2.5} />
            {chatLoading ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </div>

      {/* Ringkasan laporan final */}
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
};

export default AssistantComplaintCard;
