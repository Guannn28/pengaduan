const DEVELOPMENT_API_URL = "http://localhost:4000";

const normalizeApiBaseUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

export const API_BASE_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_API_URL) ||
  (import.meta.env.DEV ? DEVELOPMENT_API_URL : "");

const getHeaders = (token, isFormData = false) => {
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const CHATBOT_REQUEST_TIMEOUT_MS = 45000;
const CHATBOT_UPLOAD_TIMEOUT_MS = 30000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = CHATBOT_REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Layanan asisten sedang sibuk, silakan coba beberapa saat lagi.");
      timeoutError.code = "REQUEST_TIMEOUT";
      throw timeoutError;
    }

    const networkError = new Error("Koneksi ke asisten gagal. Periksa koneksi internet lalu coba lagi.");
    networkError.cause = error;
    throw networkError;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const parseJsonSafely = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const requestChatbotJson = async (url, options, timeoutMs, fallbackMessage) => {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  const data = await parseJsonSafely(res);

  if (!res.ok) {
    throw new Error(data.message || data.error || fallbackMessage);
  }

  return data;
};

export const api = {
  getMe: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/me`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal mengambil data user");
    return res.json();
  },

  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login gagal");
    return data;
  },

  register: async (formData) => {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Pendaftaran gagal");
    return data;
  },

  getComplaints: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/complaints`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal mengambil data pengaduan");
    return res.json();
  },

  updateComplaintStatus: async (token, id, status) => {
    const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Gagal memperbarui status");
    return res.json();
  },

  deleteComplaint: async (token, id) => {
    const res = await fetch(`${API_BASE_URL}/api/complaints/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal menghapus pengaduan");
    return res.json();
  },

  downloadEvidence: async (token, id) => {
    const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/evidence/download`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || "Gagal mengunduh file bukti.");
    }
    return res.blob();
  },

  getAccountRequests: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/account-requests`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal memuat permohonan akun");
    return res.json();
  },

  deleteAccountRequest: async (token, id) => {
    const res = await fetch(`${API_BASE_URL}/api/account-requests/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus permohonan akun");
    return data;
  },

  getStudentAccounts: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat data akun siswa");
    return data;
  },

  createStudentAccount: async (token, userData) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal membuat akun");
    return data;
  },

  deleteStudentAccount: async (token, id) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus akun siswa");
    return data;
  },

  exportComplaintsExcel: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/complaints/export/excel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || "Gagal mengekspor data pengaduan.");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-pengaduan.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  sendChatbotMessage: async (token, message, history, evidenceData) => {
    const body = { message, history };
    if (evidenceData) {
      body.evidenceData = evidenceData;
    }

    const data = await requestChatbotJson(
      `${API_BASE_URL}/api/chatbot/message`,
      {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(body),
      },
      CHATBOT_REQUEST_TIMEOUT_MS,
      "Layanan asisten sedang sibuk, silakan coba beberapa saat lagi."
    );

    if (!data || (!data.message && data.status !== "completed")) {
      throw new Error("Format respons asisten tidak sesuai. Silakan coba lagi.");
    }

    return data;
  },

  submitChatbotComplaint: async (token, formData) => {
    return requestChatbotJson(
      `${API_BASE_URL}/api/chatbot/submit`,
      {
        method: "POST",
        headers: getHeaders(token, true),
        body: formData,
      },
      CHATBOT_UPLOAD_TIMEOUT_MS,
      "Gagal menyimpan laporan. Silakan coba lagi."
    );
  },

  uploadChatEvidence: async (token, file) => {
    const formData = new FormData();
    formData.append("evidence", file);
    return requestChatbotJson(
      `${API_BASE_URL}/api/chatbot/upload-evidence`,
      {
        method: "POST",
        headers: getHeaders(token, true),
        body: formData,
      },
      CHATBOT_UPLOAD_TIMEOUT_MS,
      "Gagal mengupload bukti. Silakan coba lagi."
    );
  },
};
