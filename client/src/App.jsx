import { useCallback, useEffect, useMemo, useState } from "react";
import LoginLayout from "./components/LoginLayout";
import StudentPage from "./pages/StudentPage";
import AdminPage from "./pages/AdminPage";
import { resolveMediaUrl as resolveMediaUrlValue } from "./utils/formatters";
import "./App.css";
import { API_BASE_URL, api } from "./services/api";
import { useToast } from "./context/useToast";

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

const createInitialChatMessages = () => [
  {
    role: "assistant",
    content:
      "Halo, saya akan membantu menyusun laporan. Ceritakan kejadian yang ingin Anda laporkan secara singkat.",
  },
];

const createAttachmentFromEvidence = (evidence) => {
  if (!evidence?.evidenceUrl) {
    return null;
  }

  return {
    name: evidence.evidenceName || "Bukti pengaduan",
    size: evidence.evidenceSize || 0,
    type: evidence.evidenceMimeType || evidence.evidenceType || "",
    url: evidence.evidenceUrl,
  };
};

const resolveMediaUrl = (value) => {
  return resolveMediaUrlValue(value, API_BASE_URL);
};

function App() {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [accountRequests, setAccountRequests] = useState([]);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [studentAccountsLoading, setStudentAccountsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState(createInitialChatMessages);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFinalData, setChatFinalData] = useState(null);
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [selectedChatEvidenceFile, setSelectedChatEvidenceFile] = useState(null);
  const [chatAttachment, setChatAttachment] = useState(null);
  const [chatUploadedEvidence, setChatUploadedEvidence] = useState(null);
  const [chatEvidenceMentioned, setChatEvidenceMentioned] = useState(false);
  const [chatAttachUploading, setChatAttachUploading] = useState(false);
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

  const applyChatDraftEvidence = useCallback((evidence) => {
    const normalizedEvidence = evidence?.evidenceUrl ? evidence : null;
    setChatUploadedEvidence(normalizedEvidence);
    setChatAttachment(createAttachmentFromEvidence(normalizedEvidence));
    setChatEvidenceMentioned(false);
  }, []);

  const clearChatbotConversation = useCallback(() => {
    setChatMessages(createInitialChatMessages());
    setChatFinalData(null);
    setChatInput("");
    setSelectedChatEvidenceFile(null);
    setChatAttachment(null);
    setChatUploadedEvidence(null);
    setChatEvidenceMentioned(false);
    setChatAttachUploading(false);
  }, []);

  const hydrateChatbotDraft = useCallback(async (tkn) => {
    if (!tkn) {
      applyChatDraftEvidence(null);
      return;
    }

    try {
      const result = await api.getChatbotDraft(tkn);
      applyChatDraftEvidence(result.draft || null);
    } catch (err) {
      console.warn("Load chatbot draft warning", err.message || err);
    }
  }, [applyChatDraftEvidence]);

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

  const fetchMe = useCallback(async (tkn) => {
    try {
      const data = await api.getMe(tkn);
      setUser(data.user);
      await fetchComplaints(tkn);

      if (data.user?.role === "admin") {
        await Promise.all([
          fetchAccountRequests(tkn),
          fetchStudentAccounts(tkn),
        ]);
      } else {
        setAccountRequests([]);
        setStudentAccounts([]);
        setStudentAccountsLoading(false);
        await hydrateChatbotDraft(tkn);
      }
    } catch {
      setUser(null);
      setToken("");
      localStorage.removeItem("complain_token");
      setLoading(false);
    }
  }, [fetchAccountRequests, fetchComplaints, fetchStudentAccounts, hydrateChatbotDraft]);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const handleChatAttach = async (file) => {
    if (!file) {
      setSelectedChatEvidenceFile(null);
      setChatAttachment(null);
      setChatUploadedEvidence(null);
      setChatEvidenceMentioned(false);
      return;
    }

    setSelectedChatEvidenceFile(file);
    setChatAttachment({
      name: file.name,
      size: file.size,
      type: file.type,
      url: "",
    });
    setChatUploadedEvidence(null);
    setChatEvidenceMentioned(false);
    showToast("Bukti dipilih. File akan diunggah saat pesan dikirim.", "info");
  };

  const handleChatRemoveAttachment = async () => {
    if (chatAttachUploading) {
      return;
    }

    const previousAttachment = chatAttachment;
    const previousEvidence = chatUploadedEvidence;
    setSelectedChatEvidenceFile(null);
    setChatAttachment(null);
    setChatUploadedEvidence(null);
    setChatEvidenceMentioned(false);

    if (!previousEvidence?.evidenceUrl || !token) {
      return;
    }

    try {
      await api.deleteChatEvidence(token);
      showToast("Bukti berhasil dihapus dari draft.", "success");
    } catch (err) {
      setChatAttachment(previousAttachment);
      setChatUploadedEvidence(previousEvidence);
      showToast(err.message || "Gagal menghapus bukti.", "error");
    }
  };

  const handleChatSend = async () => {
    const message = chatInput.trim();
    if (!message || !token || chatLoading || chatAttachUploading) {
      return;
    }

    const userMessage = { role: "user", content: message };
    const selectedEvidenceName = selectedChatEvidenceFile?.name || chatAttachment?.name || "";
    if (selectedEvidenceName && !chatUploadedEvidence?.evidenceUrl) {
      userMessage.content += `\nLampiran bukti: ${selectedEvidenceName}`;
    } else if (chatUploadedEvidence?.evidenceUrl && !chatEvidenceMentioned) {
      const evidenceName =
        chatUploadedEvidence.evidenceName || chatAttachment?.name || "Bukti pengaduan";
      userMessage.content += `\nLampiran bukti: ${evidenceName}`;
    }
    const newMessages = [...chatMessages, userMessage];

    setChatMessages(newMessages);
    setChatInput("");
    setChatFinalData(null);
    setChatLoading(true);
    setError("");
    if (selectedEvidenceName || (chatUploadedEvidence?.evidenceUrl && !chatEvidenceMentioned)) {
      setChatEvidenceMentioned(true);
    }

    try {
      const result = await api.sendChatbotMessage(
        token,
        message,
        newMessages,
        selectedChatEvidenceFile
      );

      const assistantReply = result?.message || "";
      if (assistantReply) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantReply },
        ]);
      }

      if (Object.prototype.hasOwnProperty.call(result || {}, "draft")) {
        const draftEvidence = result.draft || null;
        if (draftEvidence) {
          // Backend confirmed evidence exists in draft – update UI to reflect it
          setChatUploadedEvidence(draftEvidence);
          setChatAttachment(createAttachmentFromEvidence(draftEvidence));
          setSelectedChatEvidenceFile(null);
        } else if (!selectedChatEvidenceFile) {
          // Backend says no draft evidence AND user has no local file pending –
          // only then clear (e.g., after complaint completion clears the draft)
          // But do NOT clear if we already have an uploaded evidence that the
          // backend just failed to echo back (defensive: preserve user's upload)
          if (!chatUploadedEvidence?.evidenceUrl) {
            setChatUploadedEvidence(null);
            setChatAttachment(null);
          }
        }
      }

      const status = result?.status || result?.data?.status;
      if (status === "completed") {
        if (result?.complaint) {
          setComplaints((prev) => [result.complaint, ...prev]);
          clearChatbotConversation();
          showToast("Laporan berhasil dikirim ke sistem!", "success");
        } else {
          showToast("Laporan siap dikirim. Periksa ringkasan sebelum dikirim.", "info");
          setChatFinalData(result?.data?.data || result?.data || null);
        }
      }
    } catch (err) {
      const assistantErrorMessage =
        err.message || "Layanan asisten sedang sibuk, silakan coba beberapa saat lagi.";
      showToast(assistantErrorMessage, "error");
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantErrorMessage,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmitComplaint = async () => {
    if (!token || !chatFinalData || chatSubmitting || chatAttachUploading) {
      return;
    }

    setChatSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      payload.append("finalData", JSON.stringify(chatFinalData));
      if (selectedChatEvidenceFile instanceof File) {
        payload.append("evidence", selectedChatEvidenceFile);
      }

      const result = await api.submitChatbotComplaint(token, payload);
      const createdComplaint = result.complaint || result.data || result;
      if (createdComplaint) {
        setComplaints((prev) => [createdComplaint, ...prev]);
      }

      clearChatbotConversation();
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
      } else {
        hydrateChatbotDraft(data.token);
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

  const handleExportComplaints = useCallback(async () => {
    try {
      await api.exportComplaintsExcel(token);
      showToast("Data pengaduan berhasil diunduh.", "success");
    } catch (err) {
      showToast(err.message || "Gagal mengekspor data pengaduan.", "error");
    }
  }, [token, showToast]);

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
    setSuccessMessage("");
    setChatMessages(createInitialChatMessages());
    setChatInput("");
    setChatLoading(false);
    setChatFinalData(null);
    setChatSubmitting(false);
    setSelectedChatEvidenceFile(null);
    setChatAttachment(null);
    setChatUploadedEvidence(null);
    setChatEvidenceMentioned(false);
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
        handleExportComplaints={handleExportComplaints}
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
