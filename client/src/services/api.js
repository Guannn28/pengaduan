const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

export const api = {
  getMe: async (token) => {
    const res = await fetch(`${API_URL}/api/me`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal mengambil data user");
    return res.json();
  },

  login: async (username, password) => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login gagal");
    return data;
  },

  register: async (formData) => {
    const res = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Pendaftaran gagal");
    return data;
  },

  getComplaints: async (token) => {
    const res = await fetch(`${API_URL}/api/complaints`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal mengambil data pengaduan");
    return res.json();
  },

  updateComplaintStatus: async (token, id, status) => {
    const res = await fetch(`${API_URL}/api/complaints/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Gagal memperbarui status");
    return res.json();
  },

  deleteComplaint: async (token, id) => {
    const res = await fetch(`${API_URL}/api/complaints/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal menghapus pengaduan");
    return res.json();
  },

  downloadEvidence: async (token, id) => {
    const res = await fetch(`${API_URL}/api/complaints/${id}/evidence/download`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || "Gagal mengunduh file bukti.");
    }
    return res.blob();
  },

  getAccountRequests: async (token) => {
    const res = await fetch(`${API_URL}/api/account-requests`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Gagal memuat permohonan akun");
    return res.json();
  },

  deleteAccountRequest: async (token, id) => {
    const res = await fetch(`${API_URL}/api/account-requests/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus permohonan akun");
    return data;
  },

  getStudentAccounts: async (token) => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat data akun siswa");
    return data;
  },

  createStudentAccount: async (token, userData) => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal membuat akun");
    return data;
  },

  deleteStudentAccount: async (token, id) => {
    const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus akun siswa");
    return data;
  },

  getDatasetInsight: async (token) => {
    const res = await fetch(`${API_URL}/api/dataset/insight`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Gagal memuat insight dataset");
    return data.data;
  },

  sendChatbotMessage: async (token, message, history, evidenceData) => {
    const body = { message, history };
    if (evidenceData) {
      body.evidenceData = evidenceData;
    }
    const res = await fetch(`${API_URL}/api/chatbot/message`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Gagal menghubungi asisten pengaduan");
    return data;
  },

  submitChatbotComplaint: async (token, formData) => {
    const res = await fetch(`${API_URL}/api/chatbot/submit`, {
      method: "POST",
      headers: getHeaders(token, true),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menyimpan laporan");
    return data;
  },

  uploadChatEvidence: async (token, file) => {
    const formData = new FormData();
    formData.append("evidence", file);
    const res = await fetch(`${API_URL}/api/chatbot/upload-evidence`, {
      method: "POST",
      headers: getHeaders(token, true),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mengupload bukti");
    return data;
  },
};
