import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Eye, EyeOff, FileCheck2, LockKeyhole, Route, ShieldCheck, UploadCloud, X } from "lucide-react";
import { Button, IconButton, InlineMessage } from "./shared/ui";

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const benefits = [
  { icon: ShieldCheck, title: "Aman", text: "Pilihan identitas anonim tersedia saat membuat laporan." },
  { icon: Route, title: "Terarah", text: "Asisten membantu menyusun laporan secara bertahap." },
  { icon: CheckCircle2, title: "Ditindaklanjuti", text: "Pantau status penanganan dari satu tempat." },
];

const LoginLayout = ({ mode = "login", onSwitchMode, authForm, setAuthForm, showPassword, setShowPassword, error, successMessage, isSubmitting, onSubmit }) => {
  const isRegister = mode === "register";
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);
  const previewUrl = useMemo(() => (authForm.studentCard ? URL.createObjectURL(authForm.studentCard) : ""), [authForm.studentCard]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const updateField = (field, value) => {
    setAuthForm({ ...authForm, [field]: value });
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const next = {};
    const username = authForm.username.trim();
    if (!username) next.username = "Username wajib diisi.";
    if (isRegister && username && !/^[a-z0-9]{5,}$/.test(username)) next.username = "Gunakan huruf kecil dan angka, minimal 5 karakter.";
    if (!isRegister && !authForm.password) next.password = "Password wajib diisi.";
    if (isRegister) {
      if (!authForm.name.trim()) next.name = "Nama lengkap wajib diisi.";
      if (!authForm.className.trim()) next.className = "Kelas wajib diisi.";
      if (!authForm.contactPhone.trim()) next.contactPhone = "Nomor kontak wajib diisi.";
      else if (!/^\+?[0-9 ()-]{8,20}$/.test(authForm.contactPhone.trim())) next.contactPhone = "Masukkan nomor telepon yang dapat dihubungi.";
      if (!authForm.studentCard) next.studentCard = "Foto kartu pelajar wajib dipilih.";
      else if (authForm.studentCard.size > 5 * 1024 * 1024) next.studentCard = "Ukuran foto maksimal 5 MB.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const switchMode = (nextMode) => {
    setFieldErrors({});
    onSwitchMode?.(nextMode);
  };

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="login-brand">
          <img src="/logo-sma.jpg" alt="Logo SMA Negeri 1 Bangunrejo" />
          <div className="brand-text"><p>SMA Negeri 1</p><strong>Bangunrejo</strong></div>
        </div>
      </header>

      <main className="login-grid">
        <section className="welcome" aria-labelledby="welcome-title">
          <span className="welcome-kicker"><LockKeyhole size={16} /> Ruang aman untuk siswa</span>
          <h1 id="welcome-title">Sistem Pengaduan Sekolah</h1>
          <p>Sampaikan pengaduan dengan mudah, aman, dan terarah.</p>
          <div className="welcome-note"><ShieldCheck size={20} /><span>Informasi Anda hanya digunakan untuk proses penanganan oleh petugas berwenang.</span></div>
        </section>

        <section className={`login-card ${isRegister ? "register-card" : ""}`} aria-labelledby="auth-title">
          {isRegister && successMessage ? (
            <div className="registration-success" role="status">
              <span className="registration-success-icon"><CheckCircle2 size={30} /></span>
              <p className="eyebrow">Pengajuan terkirim</p>
              <h2 id="auth-title">Menunggu verifikasi</h2>
              <p>{successMessage}</p>
              <div className="registration-next-step"><strong>Langkah berikutnya</strong><span>Admin sekolah akan memeriksa data dan foto kartu pelajar. Password awal akan diberikan setelah pengajuan disetujui.</span></div>
              <Button type="button" onClick={() => switchMode("login")}>Kembali ke login</Button>
            </div>
          ) : (
            <>
              <div className="login-card-heading">
                <p className="eyebrow">{isRegister ? "Pengajuan Akun" : "Selamat datang"}</p>
                <h2 id="auth-title">{isRegister ? "Ajukan Akun Siswa" : "Login"}</h2>
                <p>{isRegister ? "Isi data sesuai kartu pelajar agar dapat diverifikasi oleh admin sekolah." : "Masuk untuk membuat dan memantau pengaduan Anda."}</p>
              </div>

              {error && <InlineMessage>{error}</InlineMessage>}

              <form className="login-form" noValidate onSubmit={(event) => { event.preventDefault(); if (validate()) onSubmit(); }}>
                {isRegister && <label className="field"><span>Nama lengkap</span><input value={authForm.name} onChange={(e) => updateField("name", e.target.value)} autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}</label>}

                {isRegister && <label className="field"><span>Kelas</span><input value={authForm.className} onChange={(e) => updateField("className", e.target.value.toUpperCase())} placeholder="Contoh: XII IPA 2" aria-invalid={Boolean(fieldErrors.className)} /><small>Gunakan format kelas yang tercantum pada kartu pelajar.</small>{fieldErrors.className && <small className="field-error">{fieldErrors.className}</small>}</label>}

                {isRegister && <label className="field"><span>Nomor WhatsApp atau telepon aktif</span><input type="tel" inputMode="tel" value={authForm.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} placeholder="Contoh: 0812 3456 7890" autoComplete="tel" aria-invalid={Boolean(fieldErrors.contactPhone)} />{fieldErrors.contactPhone && <small className="field-error">{fieldErrors.contactPhone}</small>}</label>}

                <label className="field"><span>Username</span><input value={authForm.username} onChange={(e) => updateField("username", isRegister ? e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") : e.target.value)} placeholder="Contoh: budi12" autoComplete="username" aria-invalid={Boolean(fieldErrors.username)} />{isRegister && <small>Gunakan huruf kecil dan angka, minimal 5 karakter.</small>}{fieldErrors.username && <small className="field-error">{fieldErrors.username}</small>}</label>

                {isRegister ? (
                  <div className="field">
                    <span>Foto kartu pelajar</span>
                    <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(e) => updateField("studentCard", e.target.files?.[0] || null)} />
                    {authForm.studentCard ? (
                      <div className="file-selection">
                        <img src={previewUrl} alt="Pratinjau kartu pelajar yang dipilih" />
                        <div><strong><FileCheck2 size={16} /> {authForm.studentCard.name}</strong><span>{formatFileSize(authForm.studentCard.size)}</span><button type="button" className="text-button" onClick={() => fileInputRef.current?.click()}>Ganti foto</button></div>
                        <IconButton label="Hapus foto" onClick={() => updateField("studentCard", null)}><X size={18} /></IconButton>
                      </div>
                    ) : (
                      <button type="button" className="file-upload" onClick={() => fileInputRef.current?.click()}><UploadCloud size={24} /><span><strong>Pilih foto kartu pelajar</strong><small>JPEG, JPG, PNG, atau WEBP · Maksimal 5 MB</small></span></button>
                    )}
                    {fieldErrors.studentCard && <small className="field-error">{fieldErrors.studentCard}</small>}
                    <small className="privacy-note"><ShieldCheck size={14} /> Foto hanya digunakan untuk memverifikasi identitas dan hanya dapat dilihat oleh petugas berwenang.</small>
                  </div>
                ) : (
                  <label className="field">
                    <span>Password</span>
                    <span className="password-field"><input type={showPassword ? "text" : "password"} value={authForm.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Masukkan password" autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password)} /><IconButton label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</IconButton></span>
                    {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
                    <span className="password-help">Lupa password? Hubungi admin sekolah.</span>
                  </label>
                )}

                {isRegister && <p className="password-explanation">Password awal akan diberikan setelah pengajuan disetujui.</p>}
                <Button className="login-submit" type="submit" loading={isSubmitting}>{isSubmitting ? (isRegister ? "Mengirim pengajuan" : "Memeriksa akun") : (isRegister ? "Kirim Pengajuan" : "Login")}</Button>
                <div className="switch-row"><span>{isRegister ? "Sudah punya akun?" : "Belum punya akun?"}</span><button type="button" className="text-button" onClick={() => switchMode(isRegister ? "login" : "register")}>{isRegister ? "Login" : "Ajukan akun siswa"}</button></div>
              </form>

              <div className="benefit-list" aria-label="Keunggulan sistem">
                {benefits.map((benefit) => <div className="benefit-item" key={benefit.title} title={benefit.text}>{createElement(benefit.icon, { size: 18 })}<span><strong>{benefit.title}</strong><small>{benefit.text}</small></span></div>)}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default LoginLayout;
