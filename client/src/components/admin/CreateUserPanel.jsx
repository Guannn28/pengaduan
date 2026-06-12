const CreateUserPanel = ({
  createUserForm,
  setCreateUserForm,
  handleCreateUser,
  creatingUser,
  error,
  successMessage,
}) => {
  const hasSelectedRequest = Boolean(createUserForm.requestId);

  return (
    <div
      className={
        hasSelectedRequest
          ? "card submit-card account-form-card"
          : "card submit-card account-form-card is-idle"
      }
    >
      <h3>Buat Akun dari Pengajuan</h3>
      <p className="muted small">
        {hasSelectedRequest
          ? "Data pengajuan sudah disiapkan. Lengkapi password sebelum membuat akun."
          : "Pilih tombol Siapkan Akun pada salah satu pengajuan untuk mengisi data."}
      </p>
      {error && <div className="alert">{error}</div>}
      {successMessage && <div className="alert success-alert">{successMessage}</div>}
      {!hasSelectedRequest ? (
        <div className="account-form-empty">
          Pilih tombol Siapkan Akun pada salah satu pengajuan untuk mengisi data.
        </div>
      ) : (
        <form
          className="form stacked"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateUser();
          }}
        >
          <label>
            Nama Lengkap
            <input
              type="text"
              value={createUserForm.name}
              onChange={(event) =>
                setCreateUserForm({ ...createUserForm, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            Username
            <input
              type="text"
              value={createUserForm.username}
              onChange={(event) =>
                setCreateUserForm({ ...createUserForm, username: event.target.value })
              }
              required
            />
          </label>
          <label>
            Password
            <input
              type="text"
              value={createUserForm.password}
              onChange={(event) =>
                setCreateUserForm({ ...createUserForm, password: event.target.value })
              }
              required
            />
          </label>
          <label>
            Role
            <select
              value={createUserForm.role}
              onChange={(event) =>
                setCreateUserForm({ ...createUserForm, role: event.target.value })
              }
            >
              <option value="student">Siswa</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {createUserForm.role === "student" && (
            <label>
              Nama Kelas
              <input
                type="text"
                value={createUserForm.className}
                onChange={(event) =>
                  setCreateUserForm({ ...createUserForm, className: event.target.value })
                }
                required
              />
            </label>
          )}
          <div className="form-actions">
            <button
              type="submit"
              disabled={
                creatingUser ||
                !createUserForm.name.trim() ||
                !createUserForm.username.trim() ||
                !createUserForm.password.trim() ||
                (createUserForm.role === "student" && !createUserForm.className.trim())
              }
            >
              {creatingUser ? "Membuat..." : "Buat Akun"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateUserPanel;
