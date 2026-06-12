import { useCallback, useEffect, useMemo, useState } from "react";
import LoginLayout from "./components/LoginLayout";
import StudentPage from "./pages/StudentPage";
import AdminPage from "./pages/AdminPage";
import { resolveMediaUrl as resolveMediaUrlValue } from "./utils/formatters";
import "./App.css";
import { api } from "./services/api";
import { useToast } from "./context/ToastContext";

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

const resolveMediaUrl = (value) => {
  return resolveMediaUrlValue(value, API_URL);
};

function App() {
  const { showToast } = useToast();
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
  const [chatAttachment, setChatAttachment] = useState(null);
  const [chatUploadedEvidence, setChatUploadedEvidence] = useState(null);
  const [chatAttachUploading, setChatAttachUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [adminView, setAdminView] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  // error/successMessage masih digunakan untuk komponen LoginLayout yang tidak pakai toast
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
      const data = await api.getComplaints(tkn);
      setComplaints(data);
    } catch {
      showToast("Gagal memuat data pengaduan. Coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  const fetchAccountRequests = useCallback(async (tkn = token) => {
    if (!tkn) {
      setAccountRequests([]);
      return;
    }

    try {
      const data = await api.getAccountRequests(tkn);
      setAccountRequests(data);
    } catch {
      showToast("Gagal memuat permohonan akun.", "error");
    }
  }, [token, showToast]);

  const fetchStudentAccounts = useCallback(async (tkn = token) => {
    if (!tkn) {
      setStudentAccounts([]);
      setStudentAccountsLoading(false);
      return;
    }

    try {
      setStudentAccountsLoading(true);
      const data = await api.getStudentAccounts(tkn);
      setStudentAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || "Gagal memuat data akun siswa.", "error");
      setStudentAccounts([]);
    } finally {
      setStudentAccountsLoading(false);
    }
  }, [token, showToast]);

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
      const data = await api.getDatasetInsight(tkn);
      setDatasetInsight(data || null);
    } catch {
      setDatasetInsight(null);
      setDatasetInsightError("Gagal memuat insight dataset.");
    } finally {
      setDatasetInsightLoading(false);
    }
  }, [token]);

  const fetchMe = useCallback(async (tkn) => {
    try {
      const data = await api.getMe(tkn);
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

  const handleChatAttach = async (file) => {
    if (!file) {
      setChatAttachment(null);
      setChatUploadedEvidence(null);
      return;
    }

    setChatAttachment(file);
    setChatAttachUploading(true);
    try {
      const result = await api.uploadChatEvidence(token, file);
      console.log("[Frontend Debug] Bukti berhasil diupload:", result);
      setChatUploadedEvidence(result.file);
      showToast("Foto bukti berhasil dilampirkan.", "success");
    } catch (err) {
      showToast(err.message || "Gagal mengupload foto bukti.", "error");
      setChatAttachment(null);
      setChatUploadedEvidence(null);
    } finally {
      setChatAttachUploading(false);
    }
  };

  const handleChatRemoveAttachment = () => {
    setChatAttachment(null);
    setChatUploadedEvidence(null);
  };

  const handleChatSend = async () => {
    const message = chatInput.trim();
    if (!message || !token || chatLoading) {
      return;
    }

    const userMessage = { role: "user", content: message };
    // Jika ada lampiran, tampilkan info di bubble chat pengguna
    if (chatAttachment) {
      userMessage.content += `\n📎 Lampiran: ${chatAttachment.name}`;
    }
    const newMessages = [...chatMessages, userMessage];

    setChatMessages(newMessages);
    setChatInput("");
    setChatFinalData(null);
    setChatLoading(true);
    setError("");

    try {
      const result = await api.sendChatbotMessage(token, message, newMessages, chatUploadedEvidence || undefined);
      console.log("[Frontend Debug] Balasan API:", result);

      const assistantReply = result?.message || "";
      if (assistantReply) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantReply },
        ]);
      }

      // Jika response backend mengembalikan format utuh, handle juga
      const status = result?.status || result?.data?.status;
      if (status === "completed") {
        showToast("Laporan dikumpulkan secara otomatis (atau siap dikirim).", "info");
        setChatFinalData(result?.data?.data || result?.data || null);
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

      const result = await api.submitChatbotComplaint(token, payload);
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
      showToast("Laporan berhasil dikirim ke sistem!", "success");
    } catch (err) {
      showToast(err.message || "Gagal menyimpan laporan.", "error");
    } finally {
      setChatSubmitting(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      const updated = await api.updateComplaintStatus(token, id, status);
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
      showToast("Status pengaduan berhasil diperbarui.", "success");
    } catch {
      showToast("Tidak bisa memperbarui status pengaduan.", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteComplaint(token, id);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      showToast("Pengaduan berhasil dihapus.", "success");
    } catch {
      showToast("Gagal menghapus pengaduan.", "error");
    }
  };

  const handleDownloadEvidence = async (complaint) => {
    try {
      const blob = await api.downloadEvidence(token, complaint.id);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = complaint.evidenceName || "bukti-pengaduan";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast("File bukti berhasil diunduh.", "success");
    } catch (err) {
      showToast(err.message || "Gagal mengunduh file bukti.", "error");
    }
  };

  const authAction = async (mode) => {
    setError("");
    setSuccessMessage("");
    try {
      let data;
      if (mode === "register") {
        const payload = new FormData();
        payload.append("name", authForm.name);
        payload.append("username", authForm.username);
        payload.append("className", authForm.className);
        payload.append("contactPhone", authForm.contactPhone);
        if (authForm.studentCard) {
          payload.append("studentCard", authForm.studentCard);
        }
        data = await api.register(payload);
        
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
      } else {
        data = await api.login(authForm.username, authForm.password);
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
    try {
      const data = await api.createStudentAccount(token, createUserForm);
      showToast(data.message || "Akun siswa berhasil dibuat.", "success");
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
      showToast(err.message || "Gagal membuat akun.", "error");
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
    if (!confirmed) return;

    try {
      await api.deleteAccountRequest(token, id);
      setAccountRequests((prev) => prev.filter((request) => request.id !== id));
      showToast("Permohonan akun berhasil dihapus.", "success");
    } catch (err) {
      showToast(err.message || "Gagal menghapus permohonan akun.", "error");
    }
  };

  const handleDeleteStudentAccount = async (id) => {
    const confirmed = window.confirm(
      "Hapus akun siswa ini? Siswa tidak akan bisa login lagi."
    );
    if (!confirmed) return;

    try {
      const data = await api.deleteStudentAccount(token, id);
      setStudentAccounts((prev) => prev.filter((account) => account.id !== id));
      showToast(data.message || "Akun siswa berhasil dihapus.", "success");
    } catch (err) {
      showToast(err.message || "Gagal menghapus akun siswa.", "error");
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
    setChatAttachment(null);
    setChatUploadedEvidence(null);
    setChatAttachUploading(false);
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
        chatAttachment={chatAttachment}
        chatUploadedEvidence={chatUploadedEvidence}
        chatAttachUploading={chatAttachUploading}
        handleChatAttach={handleChatAttach}
        handleChatRemoveAttachment={handleChatRemoveAttachment}
      />
    );
  }

export default App;
