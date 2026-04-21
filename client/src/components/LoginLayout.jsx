const LoginLayout = ({
  mode = "login",
  onSwitchMode,
  authForm,
  setAuthForm,
  showPassword,
  setShowPassword,
  error,
  onSubmit,
}) => {
  const isRegister = mode === "register";
  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="login-brand">
          <img src="/ubl-logo.png" alt="UBL Logo" />
        </div>
      </header>

      <main className="login-grid">
        <section className="welcome">
          <h1>Selamat Datang</h1>
          <p className="muted">Sistem Pengaduan Universitas Bandar Lampung</p>
          <img
            className="welcome-illustration"
            src="/online-learning-concept.svg"
            alt="Mahasiswa belajar"
          />
        </section>

        <section className="login-card">
          <h2>{isRegister ? "Register" : "Login"}</h2>
          <p className="muted small">
            {isRegister
              ? "Masukan nama, email, dan password anda"
              : "Masukan username dan password anda"}
          </p>

          {error && <div className="alert">{error}</div>}

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {isRegister && (
              <label>
                Nama Lengkap
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                  placeholder="Nama lengkap"
                  required
                />
              </label>
            )}
            <label>
              Username
              <input
                type="text"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
                placeholder="b2421055"
                required
              />
            </label>

            <label>
              Password
              <input
                type={showPassword ? "text" : "password"}
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
                placeholder="•••••••"
                required
              />
            </label>

            <div className="login-extra">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Lihat Password
              </label>
              <a href="#" className="forgot">
                Lupa Password
              </a>
            </div>

            <button type="submit" className="primary">
              {isRegister ? "Daftar" : "Login"}
            </button>

            <div className="switch-row">
              {isRegister ? (
                <>
                  <span className="muted small">Sudah punya akun?</span>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => onSwitchMode?.("login")}
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <span className="muted small">Belum punya akun?</span>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => onSwitchMode?.("register")}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default LoginLayout;
