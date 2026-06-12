const LoginLayout = ({
  mode = "login",
  onSwitchMode,
  authForm,
  setAuthForm,
  showPassword,
  setShowPassword,
  error,
  successMessage,
  onSubmit,
}) => {
  const isRegister = mode === "register";

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="login-brand">
          <img src="/logo-sma.jpg" alt="SMA Logo" />
          <div className="brand-text">
              <p className="muted small">SMA Negeri 1</p>
              <strong className="title">Bangunrejo</strong>
            </div>
        </div>
      </header>

      <main className="login-grid">
        <section className="welcome">
          <h1>Sistem Pengaduan Sekolah</h1>
          <p className="muted">
            Laporkan dan pantau pengaduan secara aman, tertib, dan terarah.
          </p>
        </section>

        <section className="login-card">
          <h2>{isRegister ? "Permohonan Akun" : "Login"}</h2>
          <p className="muted small">
            {isRegister
              ? "Isi data sesuai kartu pelajar agar admin bisa memverifikasi."
              : "Masuk untuk mengirim dan memantau pengaduan."}
          </p>

          {error && <div className="alert">{error}</div>}
          {successMessage && <div className="alert success-alert">{successMessage}</div>}

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

            {isRegister && (
              <label>
                Nama Kelas
                <input
                  type="text"
                  value={authForm.className}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, className: e.target.value })
                  }
                  placeholder="Contoh: XII IPA 2"
                  required
                />
              </label>
            )}

            {isRegister && (
              <label>
                Nomor yang Bisa Dihubungi
                <input
                  type="text"
                  value={authForm.contactPhone}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, contactPhone: e.target.value })
                  }
                  placeholder="Contoh: 081234567890"
                  required
                />
              </label>
            )}

            <label>
              Username
              <input
                type="text"
                value={authForm.username}
                onChange={(e) =>
                  setAuthForm({ ...authForm, username: e.target.value })
                }
                placeholder="contoh: budi12"
                required
              />
            </label>

            {isRegister ? (
              <label>
                Foto Kartu Pelajar
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      studentCard: e.target.files?.[0] || null,
                    })
                  }
                  required
                />
              </label>
            ) : (
              <>
                <label>
                  Password
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authForm.password}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, password: e.target.value })
                    }
                    placeholder="Masukkan password"
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
                  <span className="muted small">Hubungi admin jika lupa password</span>
                </div>
              </>
            )}

            <button type="submit" className="primary">
              {isRegister ? "Kirim Permohonan" : "Login"}
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
                    Ajukan akun
                  </button>
                </>
              )}
            </div>
          </form>

          <div className="login-benefits" aria-label="Keunggulan sistem">
            <div className="benefit-list">
              <div className="benefit-item">
                <strong>Aman</strong>
                <span>laporan dapat dibuat anonim</span>
              </div>
              <div className="benefit-item">
                <strong>Terarah</strong>
                <span>laporan dikategorikan otomatis</span>
              </div>
              <div className="benefit-item">
                <strong>Tindak lanjut</strong>
                <span>admin/BK dapat memproses laporan</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginLayout;
