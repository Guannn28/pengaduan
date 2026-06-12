const StudentOverviewRail = ({
  user,
  initials,
  totalCount,
  progressCount,
  resolvedCount,
  fetchComplaints,
}) => (
  <aside className="overview-rail">
    <div className="rail-profile">
      <div className="avatar rail-avatar">{initials}</div>
      <div>
        <p className="muted small">Akun siswa</p>
        <strong>{user?.name}</strong>
        <span>{user?.className || "Kelas belum diisi"}</span>
      </div>
    </div>
    <div className="rail-stats">
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
    <button className="rail-action" type="button" onClick={() => fetchComplaints()}>
      Muat ulang data
    </button>
  </aside>
);

export default StudentOverviewRail;
