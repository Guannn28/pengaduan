import { FileImage, Inbox, RefreshCw } from "lucide-react";
import { formatDate } from "../../utils/formatters";
import { Button, EmptyState, LoadingSkeleton, SidePanel } from "../shared/ui";
import CreateUserPanel from "./CreateUserPanel";

const AccountRequestRow = ({ request, handleUseAccountRequest }) => (
  <div className="data-row account-request-row admin-request-card">
    <span data-label="Siswa"><strong>{request.name}</strong><small>@{request.username || "-"}</small></span>
    <span data-label="Kelas">{request.className || "-"}</span>
    <span data-label="Kontak">{request.contactPhone || "-"}</span>
    <span data-label="Tanggal pengajuan">{formatDate(request.createdAt)}</span>
    <span data-label="Dokumen">{request.studentCardUrl ? <span className="attachment-chip"><FileImage size={14} /> Kartu tersedia</span> : <span className="muted">Tidak ada</span>}</span>
    <span data-label="Status"><span className="badge warning">Menunggu verifikasi</span></span>
    <span className="row-actions" data-label="Aksi"><Button variant="secondary" type="button" onClick={() => handleUseAccountRequest(request)}>Tinjau</Button></span>
  </div>
);

const AccountRequestsSection = ({ accountRequests, accountRequestsLoading, fetchAccountRequests, resolveMediaUrl, handleUseAccountRequest, createUserForm, setCreateUserForm, handleCreateUser, creatingUser, error, successMessage }) => {
  const pendingRequests = accountRequests.filter((request) => request.status === "pending");
  const selectedRequest = pendingRequests.find((request) => request.id === createUserForm.requestId);
  const closePanel = () => setCreateUserForm({ name: "", username: "", password: "", role: "student", className: "", requestId: "" });

  return (
    <section className="card data-section account-requests-card">
      <header className="card-head"><div><p className="section-eyebrow">Verifikasi siswa</p><h2>Daftar pengajuan</h2><p>Tinjau identitas siswa sebelum membuat akses akun.</p></div><Button variant="secondary" type="button" onClick={() => fetchAccountRequests()}><RefreshCw size={16} /> Perbarui data</Button></header>
      {accountRequestsLoading ? <LoadingSkeleton rows={5} /> : pendingRequests.length === 0 ? (
        <EmptyState icon={<Inbox size={30} />} title="Tidak ada pengajuan akun yang perlu ditinjau" description="Semua pengajuan saat ini telah diproses." />
      ) : (
        <div className="data-table account-request-table"><div className="data-row data-head account-request-row"><span>Siswa</span><span>Kelas</span><span>Kontak</span><span>Tanggal pengajuan</span><span>Dokumen</span><span>Status</span><span>Aksi</span></div>{pendingRequests.map((request) => <AccountRequestRow key={request.id} request={request} handleUseAccountRequest={handleUseAccountRequest} />)}</div>
      )}

      <SidePanel open={Boolean(selectedRequest)} title="Tinjau pengajuan akun" description="Pastikan data sesuai dengan kartu pelajar sebelum akun dibuat." onClose={closePanel}>
        {selectedRequest?.studentCardUrl && <div className="student-card-preview"><span>Foto kartu pelajar</span><img src={resolveMediaUrl(selectedRequest.studentCardUrl)} alt={`Kartu pelajar ${selectedRequest.name}`} /></div>}
        <div className="request-detail-grid"><div><span>Nama lengkap</span><strong>{selectedRequest?.name}</strong></div><div><span>Kelas</span><strong>{selectedRequest?.className}</strong></div><div><span>Username</span><strong>@{selectedRequest?.username}</strong></div><div><span>Nomor kontak</span><strong>{selectedRequest?.contactPhone}</strong></div><div><span>Diajukan</span><strong>{formatDate(selectedRequest?.createdAt)}</strong></div></div>
        <CreateUserPanel createUserForm={createUserForm} setCreateUserForm={setCreateUserForm} handleCreateUser={handleCreateUser} creatingUser={creatingUser} error={error} successMessage={successMessage} onClose={closePanel} />
      </SidePanel>
    </section>
  );
};

export default AccountRequestsSection;
