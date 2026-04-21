import { useCallback, useEffect, useMemo, useState } from "react";
import LoginLayout from "./components/LoginLayout";
import StudentPage from "./components/StudentPage";
import AdminPage from "./components/AdminPage";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const complaintCategories = [
  "Sarana dan Prasarana",
  "Akademik",
  "Kasus Pembulian",
  "Administrasi",
  "Lainnya",
];

const statusOptions = [
  { value: "submitted", label: "Diajukan" },
  { value: "in_progress", label: "Diproses" },
  { value: "resolved", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

const statusColor = {
  submitted: "badge warning",
  in_progress: "badge info",
  resolved: "badge success",
  rejected: "badge danger",
};

const headers = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const resolveMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_URL}${value}`;
};

function App() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: complaintCategories[0],
    message: "",
    evidence: null,
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("complain_token") || ""
  );

  const fetchComplaints = useCallback(async (tkn = token) => {
    if (!tkn) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/complaints`, {
        headers: headers(tkn),
      });
      const data = await res.json();
      setComplaints(data);
    } catch {
      setError("Gagal memuat data, coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = useCallback(async (tkn) => {
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        headers: headers(tkn),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data.user);
      await fetchComplaints(tkn, data.user);
    } catch {
      setUser(null);
      setToken("");
      localStorage.removeItem("complain_token");
      setLoading(false);
    }
  }, [fetchComplaints]);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Login terlebih dahulu untuk mengirim pengaduan.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/complaints`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: (() => {
          const payload = new FormData();
          payload.append("category", form.category);
          payload.append("message", form.message);
          if (form.evidence) {
            payload.append("evidence", form.evidence);
          }
          return payload;
        })(),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Gagal mengirim pengaduan.");
      }
      const created = await res.json();
      setComplaints((prev) => [created, ...prev]);
      setForm({ category: complaintCategories[0], message: "", evidence: null });
    } catch (err) {
      setError(err.message || "Gagal mengirim pengaduan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: headers(token),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
    } catch {
      setError("Tidak bisa memperbarui status.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/complaints/${id}`, {
        method: "DELETE",
        headers: headers(token),
      });
      if (!res.ok) throw new Error();
      setComplaints((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Gagal menghapus pengaduan.");
    }
  };

  const handleDownloadEvidence = async (complaint) => {
    try {
      setError("");
      const res = await fetch(`${API_URL}/api/complaints/${complaint.id}/evidence/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Gagal mengunduh file bukti.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = complaint.evidenceName || "bukti-pengaduan";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.message || "Gagal mengunduh file bukti.");
    }
  };

  const authAction = async (mode) => {
    setError("");
    const endpoint = mode === "register" ? "register" : "login";
    const payload =
      mode === "register"
        ? authForm
        : { email: authForm.email, password: authForm.password };
    try {
      const res = await fetch(`${API_URL}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || "Gagal masuk/daftar");
      }
      const data = await res.json();
      setToken(data.token);
      localStorage.setItem("complain_token", data.token);
      setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      fetchComplaints(data.token, data.user);
    } catch (err) {
      setError(err.message || "Login/daftar gagal.");
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("complain_token");
    setComplaints([]);
  };

  const filtered = useMemo(() => {
    if (filter === "all") return complaints;
    return complaints.filter((c) => c.status === filter);
  }, [complaints, filter]);

  if (!user) {
    return (
      <LoginLayout
        mode={authMode}
        onSwitchMode={(mode) => {
          setAuthMode(mode);
          setError("");
        }}
        authForm={authForm}
        setAuthForm={setAuthForm}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        error={error}
        onSubmit={() => {
          authAction(authMode);
        }}
      />
    );
  }

  if (user.role === "admin") {
    return (
      <AdminPage
        user={user}
        logout={logout}
        loading={loading}
        filtered={filtered}
        filter={filter}
        setFilter={setFilter}
        resolveMediaUrl={resolveMediaUrl}
        statusOptions={statusOptions}
        statusColor={statusColor}
        fetchComplaints={fetchComplaints}
        handleStatus={handleStatus}
        handleDelete={handleDelete}
        handleDownloadEvidence={handleDownloadEvidence}
      />
    );
  }

  return (
    <StudentPage
      user={user}
      form={form}
      setForm={setForm}
      resolveMediaUrl={resolveMediaUrl}
      submitting={submitting}
      handleSubmit={handleSubmit}
      logout={logout}
      error={error}
      complaintCategories={complaintCategories}
      loading={loading}
      filtered={filtered}
      filter={filter}
      setFilter={setFilter}
      statusOptions={statusOptions}
      statusColor={statusColor}
      fetchComplaints={fetchComplaints}
    />
  );
}

export default App;
