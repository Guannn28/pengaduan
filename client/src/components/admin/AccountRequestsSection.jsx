import { formatDate } from "../../utils/formatters";
import CreateUserPanel from "./CreateUserPanel";

const AccountRequestRow = ({
  request,
  resolveMediaUrl,
  handleUseAccountRequest,
  handleDeleteAccountRequest,
}) => {
  const mediaUrl = request.studentCardUrl ? resolveMediaUrl(request.studentCardUrl) : "";
  const isPending = request.status === "pending";

  return (
    <div className="table-slim account-request-row">
      <span data-label="Nama / Username">
        <strong>{request.name}</strong>
        <p className="muted small">{request.username || "-"}</p>
        <p className="muted small">{request.contactPhone || "-"}</p>
      </span>
      <span data-label="Kelas">{request.className || "-"}</span>
      <span data-label="Tanggal Pengajuan" className="muted small">
        {formatDate(request.createdAt)}
      </span>
      <span data-label="Status">
        <span className={isPending ? "badge warning" : "badge success"}>
          {isPending ? "Diajukan" : "Selesai"}
        </span>
      </span>
      <span data-label="Lampiran">
        {!request.studentCardUrl ? (
          <span className="muted small">Tidak ada</span>
        ) : request.studentCardType?.startsWith("image/") ? (
          <img
            className="evidence-thumb"
            src={mediaUrl}
            alt={request.studentCardName || "Kartu pelajar"}
          />
        ) : (
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="ghost-link">
            Lihat lampiran
          </a>
        )}
      </span>
      <span className="admin-actions" data-label="Aksi">
        {isPending ? (
          <button type="button" className="ghost" onClick={() => handleUseAccountRequest(request)}>
            Siapkan Akun
          </button>
        ) : (
          <button
            type="button"
            className="ghost danger-text"
            onClick={() => handleDeleteAccountRequest(request.id)}
          >
            Hapus
          </button>
        )}
      </span>
    </div>
  );
};

const AccountRequestsSection = ({
  accountRequests,
  fetchAccountRequests,
  resolveMediaUrl,
  handleUseAccountRequest,
  handleDeleteAccountRequest,
  createUserForm,
  setCreateUserForm,
  handleCreateUser,
  creatingUser,
  error,
  successMessage,
}) => {
  const pendingRequests = accountRequests.filter((request) => request.status === "pending");
  const completedRequests = accountRequests.filter((request) => request.status !== "pending");

  return (
    <section className="student-grid admin-grid">
      <div className="card schedule-card account-requests-card">
        <div className="card-head">
          <div>
            <h3>Pengajuan Akun</h3>
            <p className="muted small">Daftar utama hanya berisi pengajuan yang belum selesai.</p>
          </div>
          <button className="ghost" type="button" onClick={() => fetchAccountRequests()}>
            Muat ulang
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="empty">Belum ada pengajuan akun baru.</div>
        ) : (
          <div className="table-card admin-table account-request-table">
            <div className="table-slim head account-request-row">
              <span>Nama / Username</span>
              <span>Kelas</span>
              <span>Tanggal Pengajuan</span>
              <span>Status</span>
              <span>Lampiran</span>
              <span>Aksi</span>
            </div>
            {pendingRequests.map((request) => (
              <AccountRequestRow
                key={request.id}
                request={request}
                resolveMediaUrl={resolveMediaUrl}
                handleUseAccountRequest={handleUseAccountRequest}
                handleDeleteAccountRequest={handleDeleteAccountRequest}
              />
            ))}
          </div>
        )}

        {completedRequests.length > 0 && (
          <details className="account-history-section">
            <summary>
              <span>Riwayat selesai</span>
              <strong>{completedRequests.length}</strong>
            </summary>
            <div className="table-card admin-table account-request-table account-history-table">
              <div className="table-slim head account-request-row">
                <span>Nama / Username</span>
                <span>Kelas</span>
                <span>Tanggal Pengajuan</span>
                <span>Status</span>
                <span>Lampiran</span>
                <span>Aksi</span>
              </div>
              {completedRequests.map((request) => (
                <AccountRequestRow
                  key={request.id}
                  request={request}
                  resolveMediaUrl={resolveMediaUrl}
                  handleUseAccountRequest={handleUseAccountRequest}
                  handleDeleteAccountRequest={handleDeleteAccountRequest}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      <CreateUserPanel
        createUserForm={createUserForm}
        setCreateUserForm={setCreateUserForm}
        handleCreateUser={handleCreateUser}
        creatingUser={creatingUser}
        error={error}
        successMessage={successMessage}
      />
    </section>
  );
};

export default AccountRequestsSection;
