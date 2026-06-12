import { useCallback, useEffect, useMemo, useState } from "react";
import LoginLayout from "./components/LoginLayout";
import StudentPage from "./components/StudentPage";
import AdminPage from "./components/AdminPage";
import { resolveMediaUrl as resolveMediaUrlValue } from "./utils/formatters";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
  return resolveMediaUrlValue(value, API_URL);
};

function App() {
  const [complaints, setComplaints] = useState([]);
  const [accountRequests, setAccountRequests] = useState([]);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [studentAccountsLoading, setStudentAccountsLoading] = useState(false);
  const [datasetInsight, setDatasetInsight] = useState(null);
  const [datasetInsightLoading, setDatasetInsightLoading] = useState(false);
  const [datasetInsightError, setDatasetInsightError] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Halo, saya akan membantu menyusun laporan. Ceritakan kejadian yang ingin Anda laporkan secara singkat.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFinalData, setChatFinalData] = useState(null);
  const [chatEvidence, setChatEvidence] = useState(null);
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [chatEvidenceInputKey, setChatEvidenceInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [adminView, setAdminView] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    username: "",
    password: "",
    className: "",
    contactPhone: "",
    studentCard: null,
  });
  const [createUserForm, setCreateUserForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "student",
    className: "",
    requestId: "",
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

  const fetchAccountRequests = useCallback(async (tkn = token) => {
    if (!tkn) {
      setAccountRequests([]);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/account-requests`, {
        headers: headers(tkn),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAccountRequests(data);
    } catch {
      setError("Gagal memuat permohonan akun.");
    }
  }, [token]);

  const fetchStudentAccounts = useCallback(async (tkn = token) => {
    if (!tkn) {
      setStudentAccounts([]);
      setStudentAccountsLoading(false);
      return;
    }

    try {
      setStudentAccountsLoading(true);
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: headers(tkn),
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat data akun siswa.");
      }
      setStudentAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat data akun siswa.");
      setStudentAccounts([]);
    } finally {
      setStudentAccountsLoading(false);
    }
  }, [token]);

  const fetchDatasetInsight = useCallback(async (tkn = token) => {
    if (!tkn) {
      setDatasetInsight(null);
      setDatasetInsightLoading(false);
      setDatasetInsightError("");
      return;
    }

    try {
      setDatasetInsightLoading(true);
      setDatasetInsightError("");
      const res = await fetch(`${API_URL}/api/dataset/insight`, {
        headers: headers(tkn),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memuat insight dataset.");
      }
      setDatasetInsight(data.data || null);
    } catch {
      setDatasetInsight(null);
      setDatasetInsightError("Gagal memuat insight dataset.");
    } finally {
      setDatasetInsightLoading(false);
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
      await fetchComplaints(tkn);

      if (data.user?.role === "admin") {
        await Promise.all([
          fetchAccountRequests(tkn),
          fetchStudentAccounts(tkn),
          fetchDatasetInsight(tkn),
        ]);
      } else {
        setAccountRequests([]);
        setStudentAccounts([]);
        setStudentAccountsLoading(false);
        setDatasetInsight(null);
        setDatasetInsightError("");
        setDatasetInsightLoading(false);
      }
    } catch {
      setUser(null);
      setToken("");
      localStorage.removeItem("complain_token");
      setLoading(false);
    }
  }, [fetchAccountRequests, fetchComplaints, fetchDatasetInsight, fetchStudentAccounts]);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const handleChatSend = async () => {
    const message = chatInput.trim();
    if (!message || !token || chatLoading) {
      return;
    }

    const userMessage = { role: "user", content: message };
    const newMessages = [...chatMessages, userMessage];

    setChatMessages(newMessages);
    setChatInput("");
    setChatFinalData(null);
    setChatLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/chatbot/message`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          message,
          history: newMessages,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          result.error || result.message || "Gagal menghubungi asisten pengaduan."
        );
      }

      const assistantReply = result?.data?.reply || "";
      if (assistantReply) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantReply },
        ]);
      }

      if (result?.data?.status === "completed") {
        setChatFinalData(result.data.data || null);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            String(err.message || "").toLowerCase().includes("chatbot")
              ? "Asisten pengaduan belum siap. Coba lagi beberapa saat."
              : err.message || "Gagal menghubungi asisten pengaduan.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmitComplaint = async () => {
    if (!token || !chatFinalData || chatSubmitting) {
      return;
    }

    setChatSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      payload.append("finalData", JSON.stringify(chatFinalData));
      if (chatEvidence) {
        payload.append("evidence", chatEvidence);
      }

      const res = await fetch(`${API_URL}/api/chatbot/submit`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || "Gagal menyimpan laporan.");
      }

      const createdComplaint = result.complaint || result.data || result;
      if (createdComplaint) {
        setComplaints((prev) => [createdComplaint, ...prev]);
      }

      setChatMessages([
        {
          role: "assistant",
          content:
            "Halo, saya akan membantu menyusun laporan. Ceritakan kejadian yang ingin Anda laporkan secara singkat.",
        },
      ]);
      setChatFinalData(null);
      setChatEvidence(null);
      setChatEvidenceInputKey((prev) => prev + 1);
      setChatInput("");
      setSuccessMessage("Laporan berhasil dikirim ke database.");
    } catch (err) {
      setError(err.message || "Gagal menyimpan laporan.");
    } finally {
      setChatSubmitting(false);
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
    setSuccessMessage("");
    const endpoint = mode === "register" ? "register" : "login";
    try {
      const res = await fetch(`${API_URL}/api/${endpoint}`, {
        method: "POST",
        headers:
          mode === "register" ? undefined : { "Content-Type": "application/json" },
        body:
          mode === "register"
            ? (() => {
                const payload = new FormData();
                payload.append("name", authForm.name);
                payload.append("username", authForm.username);
                payload.append("className", authForm.className);
                payload.append("contactPhone", authForm.contactPhone);
                if (authForm.studentCard) {
                  payload.append("studentCard", authForm.studentCard);
                }
                return payload;
              })()
            : JSON.stringify({
                username: authForm.username,
                password: authForm.password,
              }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || "Gagal masuk/daftar");
      }
      const data = await res.json();

      if (mode === "register") {
        setSuccessMessage(
          data.message || "Permohonan akun berhasil dikirim. Tunggu diproses."
        );
        setAuthForm({
          name: "",
          username: "",
          password: "",
          className: "",
          contactPhone: "",
          studentCard: null,
        });
        setAuthMode("login");
        return;
      }

      setToken(data.token);
      localStorage.setItem("complain_token", data.token);
      setUser(data.user);
      setAuthForm({
        name: "",
        username: "",
        password: "",
        className: "",
        contactPhone: "",
        studentCard: null,
      });
      fetchComplaints(data.token);
      if (data.user?.role === "admin") {
        fetchAccountRequests(data.token);
        fetchStudentAccounts(data.token);
        fetchDatasetInsight(data.token);
      }
    } catch (err) {
      setError(err.message || "Login/daftar gagal.");
    }
  };

  const handleCreateUser = async () => {
    setCreatingUser(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify(createUserForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat akun.");
      }

      setSuccessMessage(data.message || "Akun berhasil dibuat.");
      setCreateUserForm({
        name: "",
        username: "",
        password: "",
        role: "student",
        className: "",
        requestId: "",
      });
      await Promise.all([fetchAccountRequests(), fetchStudentAccounts()]);
    } catch (err) {
      setError(err.message || "Gagal membuat akun.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUseAccountRequest = (request) => {
    setCreateUserForm({
      name: request.name || "",
      username: request.username || "",
      password: "",
      role: "student",
      className: request.className || "",
      requestId: request.id || "",
    });
    setError("");
    setSuccessMessage("");
  };

  const handleDeleteAccountRequest = async (id) => {
    const confirmed = window.confirm(
      "Hapus permohonan akun ini dari daftar? Tindakan ini tidak bisa dibatalkan."
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      const res = await fetch(`${API_URL}/api/account-requests/${id}`, {
        method: "DELETE",
        headers: headers(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus permohonan akun.");
      }

      setAccountRequests((prev) => prev.filter((request) => request.id !== id));
      setSuccessMessage("Permohonan akun berhasil dihapus.");
    } catch (err) {
      setError(err.message || "Gagal menghapus permohonan akun.");
    }
  };

  const handleDeleteStudentAccount = async (id) => {
    const confirmed = window.confirm(
      "Hapus akun siswa ini? Siswa tidak akan bisa login lagi."
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: headers(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus akun siswa.");
      }

      setStudentAccounts((prev) => prev.filter((account) => account.id !== id));
      setSuccessMessage(data.message || "Akun siswa berhasil dihapus.");
    } catch (err) {
      setError(err.message || "Gagal menghapus akun siswa.");
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("complain_token");
    setComplaints([]);
    setAccountRequests([]);
    setStudentAccounts([]);
    setStudentAccountsLoading(false);
    setDatasetInsight(null);
    setDatasetInsightLoading(false);
    setDatasetInsightError("");
    setSuccessMessage("");
    setChatMessages([
      {
        role: "assistant",
        content:
          "Halo, saya akan membantu menyusun laporan. Ceritakan kejadian yang ingin Anda laporkan secara singkat.",
      },
    ]);
    setChatInput("");
    setChatLoading(false);
    setChatFinalData(null);
    setChatEvidence(null);
    setChatSubmitting(false);
    setChatEvidenceInputKey((prev) => prev + 1);
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
          setSuccessMessage("");
        }}
        authForm={authForm}
        setAuthForm={setAuthForm}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        error={error}
        successMessage={successMessage}
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
        adminView={adminView}
        setAdminView={setAdminView}
        loading={loading}
        complaints={complaints}
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
        accountRequests={accountRequests}
        fetchAccountRequests={fetchAccountRequests}
        studentAccounts={studentAccounts}
        studentAccountsLoading={studentAccountsLoading}
        fetchStudentAccounts={fetchStudentAccounts}
        handleDeleteStudentAccount={handleDeleteStudentAccount}
        datasetInsight={datasetInsight}
        datasetInsightLoading={datasetInsightLoading}
        datasetInsightError={datasetInsightError}
        createUserForm={createUserForm}
        setCreateUserForm={setCreateUserForm}
        handleCreateUser={handleCreateUser}
        creatingUser={creatingUser}
        handleUseAccountRequest={handleUseAccountRequest}
        handleDeleteAccountRequest={handleDeleteAccountRequest}
        error={error}
        successMessage={successMessage}
      />
    );
  }

  return (
      <StudentPage
        user={user}
        resolveMediaUrl={resolveMediaUrl}
        logout={logout}
        error={error}
        loading={loading}
        complaints={complaints}
        filtered={filtered}
        filter={filter}
        setFilter={setFilter}
        statusOptions={statusOptions}
        statusColor={statusColor}
        fetchComplaints={fetchComplaints}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        chatFinalData={chatFinalData}
        chatEvidence={chatEvidence}
        setChatEvidence={setChatEvidence}
        chatEvidenceInputKey={chatEvidenceInputKey}
        chatSubmitting={chatSubmitting}
        handleChatSend={handleChatSend}
        handleChatSubmitComplaint={handleChatSubmitComplaint}
      />
    );
  }

export default App;
