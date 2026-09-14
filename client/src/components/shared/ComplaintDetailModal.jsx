import { useEffect, useRef } from "react";
import { Check, Circle, Download, X } from "lucide-react";
import {
  complaintDetailLabels,
  formatDate,
  getStatusLabel,
  getUrgencyBadgeClass,
  getUrgencyValue,
} from "../../utils/formatters";
import { IconButton } from "./ui";

const getParsedFieldValue = (parsedFields, key) =>
  parsedFields.find((field) => field.key === key)?.value || "Tidak ada";

const ComplaintEvidence = ({
  complaint,
  isAdmin,
  resolveMediaUrl,
  handleDownloadEvidence,
}) => {
  const evidenceUrl = complaint.evidenceUrl;

  if (!evidenceUrl) {
    return (
      <p className="muted small">
        {isAdmin ? "Tidak ada bukti." : "Tidak ada bukti"}
      </p>
    );
  }

  const mediaUrl = resolveMediaUrl ? resolveMediaUrl(evidenceUrl) : evidenceUrl;
  const evidenceType = complaint.evidenceMimeType || complaint.evidenceType || "";
  const previewClass = isAdmin
    ? "evidence-preview complaint-preview-thumb"
    : "student-evidence-preview student-evidence-preview-large";

  return (
    <div className="evidence-actions">
      {evidenceType.startsWith("image/") ? (
        <img
          className={previewClass}
          src={mediaUrl}
          alt={complaint.evidenceName || "Bukti pengaduan"}
        />
      ) : evidenceType.startsWith("video/") ? (
        <video
          className={previewClass}
          src={mediaUrl}
          controls
          preload="metadata"
        />
      ) : (
        <a href={mediaUrl} target="_blank" rel="noreferrer" className="ghost-link">
          Lihat bukti
        </a>
      )}
      <p className="muted small">{complaint.evidenceName || "Bukti pengaduan"}</p>
      {isAdmin && handleDownloadEvidence && (
        <button
          className="ghost small-btn"
          type="button"
          onClick={() => handleDownloadEvidence(complaint)}
        >
          <Download size={16} /> Unduh
        </button>
      )}
    </div>
  );
};

const AdminSummary = ({ complaint, statusOptions, statusColor, urgency }) => (
  <div className="complaint-detail-grid">
    <div className="complaint-detail-item">
      <span>Pelapor</span>
      <strong>{complaint.name || "-"}</strong>
      <p className="muted small">
        {complaint.isAnonymous ? "Identitas disembunyikan" : complaint.username || "-"}
      </p>
    </div>
    <div className="complaint-detail-item">
      <span>Kategori</span>
      <strong>{complaint.category || "-"}</strong>
    </div>
    {urgency && (
      <div className="complaint-detail-item">
        <span>Urgensi</span>
        <strong>
          <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>
        </strong>
      </div>
    )}
    <div className="complaint-detail-item">
      <span>Status</span>
      <strong>
        <span className={statusColor[complaint.status] || "badge"}>
          {getStatusLabel(statusOptions, complaint.status)}
        </span>
      </strong>
    </div>
    <div className="complaint-detail-item">
      <span>Tanggal</span>
      <strong>{formatDate(complaint.createdAt)}</strong>
    </div>
    {complaint.source && (
      <div className="complaint-detail-item">
        <span>Sumber</span>
        <strong>{complaint.source}</strong>
      </div>
    )}
  </div>
);

const StudentSummary = ({ complaint, statusOptions, statusColor, urgency }) => {
  const statusLabel = getStatusLabel(statusOptions, complaint.status);
  const typeLabel = complaint.isAnonymous ? "Anonim" : "Tidak anonim";
  const createdAtLabel = complaint.createdAt ? formatDate(complaint.createdAt) : "Tidak ada";

  return (
    <div className="student-complaint-detail-grid">
      <div className="student-complaint-detail-item">
        <span>Status</span>
        <strong>
          <span className={statusColor[complaint.status] || "badge"}>{statusLabel}</span>
        </strong>
      </div>
      <div className="student-complaint-detail-item">
        <span>Kategori</span>
        <strong>{complaint.category || "Tidak ada"}</strong>
      </div>
      <div className="student-complaint-detail-item">
        <span>Tipe</span>
        <strong>{typeLabel}</strong>
      </div>
      <div className="student-complaint-detail-item">
        <span>Tanggal</span>
        <strong>{createdAtLabel}</strong>
      </div>
      {urgency && (
        <div className="student-complaint-detail-item">
          <span>Urgensi</span>
          <strong>
            <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>
          </strong>
        </div>
      )}
    </div>
  );
};

const AdminMessage = ({ complaint, parsedFields }) => (
  <div className="complaint-detail-item complaint-detail-message">
    <span>Detail Laporan</span>
    {parsedFields.some((field) => field.value) ? (
      <div className="complaint-detail-message-list">
        {parsedFields.map((field) => (
          <div key={field.key} className="complaint-detail-message-row">
            <strong>{field.label}</strong>
            <p>{field.value || "Tidak ada"}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="complaint-detail-raw">{complaint.rawMessage || "-"}</p>
    )}
  </div>
);

const StudentMessage = ({ complaint, parsedFields }) => {
  if (parsedFields.length === 0) {
    return (
      <div className="student-complaint-detail-item">
        <span>Detail Pesan</span>
        <p className="student-complaint-raw">{complaint.rawMessage || "-"}</p>
      </div>
    );
  }

  return (
    <>
      {complaintDetailLabels.map(([key, label]) => (
        <div key={key} className="student-complaint-detail-item">
          <span>{label}</span>
          <strong>{getParsedFieldValue(parsedFields, key)}</strong>
        </div>
      ))}
    </>
  );
};

const ComplaintDetailModal = ({
  role = "student",
  selectedComplaintDetail,
  statusOptions = [],
  statusColor = {},
  resolveMediaUrl,
  handleDownloadEvidence,
  onClose,
}) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!selectedComplaintDetail) return undefined;
    const previousFocus = document.activeElement;
    contentRef.current?.focus();
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      previousFocus?.focus?.();
    };
  }, [selectedComplaintDetail, onClose]);

  if (!selectedComplaintDetail) return null;

  const isAdmin = role === "admin";
  const parsedFields = Array.isArray(selectedComplaintDetail.parsedFields)
    ? selectedComplaintDetail.parsedFields
    : [];
  const urgency = getUrgencyValue(selectedComplaintDetail);
  const timelineSteps = [
    { key: "submitted", label: "Dikirim" },
    { key: "reviewed", label: "Ditinjau" },
    { key: "in_progress", label: "Diproses" },
    { key: "resolved", label: "Selesai" },
  ];
  const currentStep = selectedComplaintDetail.status === "submitted" ? 0 : selectedComplaintDetail.status === "in_progress" ? 2 : selectedComplaintDetail.status === "resolved" ? 3 : 0;

  return (
    <div
      className={isAdmin ? "complaint-detail-modal" : "student-complaint-modal"}
      role="dialog"
      aria-modal="true"
      aria-labelledby={isAdmin ? "complaint-detail-title" : "student-complaint-detail-title"}
    >
      <button
        type="button"
        className={isAdmin ? "complaint-detail-overlay" : "student-complaint-modal-overlay"}
        onClick={onClose}
        aria-label="Tutup detail pengaduan"
      />
      <div className="complaint-detail-content" ref={contentRef} tabIndex="-1">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 id={isAdmin ? "complaint-detail-title" : "student-complaint-detail-title"}>
                Detail Pengaduan
              </h3>
              <p className="muted small">
                {isAdmin
                  ? "Isi lengkap pengaduan ditampilkan di bawah ini."
                  : "Isi lengkap pengaduan Anda ditampilkan di bawah ini."}
              </p>
            </div>
            <IconButton label="Tutup detail pengaduan" onClick={onClose}><X size={20} /></IconButton>
          </div>

          {isAdmin ? (
            <AdminSummary
              complaint={selectedComplaintDetail}
              statusOptions={statusOptions}
              statusColor={statusColor}
              urgency={urgency}
            />
          ) : (
            <StudentSummary
              complaint={selectedComplaintDetail}
              statusOptions={statusOptions}
              statusColor={statusColor}
              urgency={urgency}
            />
          )}

          <div className="status-timeline" aria-label="Perkembangan pengaduan">
            {timelineSteps.map((step, index) => {
              const complete = index <= currentStep && selectedComplaintDetail.status !== "rejected";
              return (
                <div className={complete ? "timeline-step complete" : "timeline-step"} key={step.key}>
                  <span>{complete ? <Check size={14} /> : <Circle size={12} />}</span>
                  <strong>{step.label}</strong>
                </div>
              );
            })}
          </div>

          {isAdmin ? (
            <AdminMessage complaint={selectedComplaintDetail} parsedFields={parsedFields} />
          ) : (
            <StudentMessage complaint={selectedComplaintDetail} parsedFields={parsedFields} />
          )}

          <div className={isAdmin ? "complaint-detail-item" : "student-complaint-evidence"}>
            <span>{isAdmin ? "Bukti File" : "Bukti"}</span>
            <ComplaintEvidence
              complaint={selectedComplaintDetail}
              isAdmin={isAdmin}
              resolveMediaUrl={resolveMediaUrl}
              handleDownloadEvidence={handleDownloadEvidence}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;
