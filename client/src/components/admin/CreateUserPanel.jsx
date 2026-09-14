import { Button, InlineMessage } from "../shared/ui";

const CreateUserPanel = ({
  createUserForm,
  setCreateUserForm,
  handleCreateUser,
  creatingUser,
  error,
  successMessage,
  onClose,
}) => {
  const hasSelectedRequest = Boolean(createUserForm.requestId);

  return (
    <div
      className="create-user-panel"
    >
      <h3>Setujui dan buat akun</h3>
      <p className="muted small">
        {hasSelectedRequest
          ? "Data pengajuan sudah disiapkan. Lengkapi password sebelum membuat akun."
          : "Pilih tombol Siapkan Akun pada salah satu pengajuan untuk mengisi data."}
      </p>
      {error && <InlineMessage>{error}</InlineMessage>}
      {successMessage && <InlineMessage type="success">{successMessage}</InlineMessage>}
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
                Nama lengkap
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
                Password awal
                <input
                  type="password"
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
              Kelas
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
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={creatingUser}
              disabled={
                creatingUser ||
                !createUserForm.name.trim() ||
                !createUserForm.username.trim() ||
                !createUserForm.password.trim() ||
                (createUserForm.role === "student" && !createUserForm.className.trim())
              }
            >
              {creatingUser ? "Membuat akun" : "Setujui dan buat akun"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateUserPanel;
