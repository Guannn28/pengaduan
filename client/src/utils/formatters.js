export const resolveMediaUrl = (value, apiUrl) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return "";
  if (/^https?:\/\//i.test(normalizedValue)) return normalizedValue;
  if (normalizedValue.startsWith("/uploads/")) {
    const normalizedApiUrl = String(apiUrl || "").replace(/\/+$/, "");
    return normalizedApiUrl ? `${normalizedApiUrl}${normalizedValue}` : normalizedValue;
  }
  return normalizedValue;
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
};

export const getStatusLabel = (statusOptions, status) =>
  statusOptions.find((option) => option.value === status)?.label ?? status ?? "-";

export const complaintDetailLabels = [
  ["kronologi", "Kronologi"],
  ["lokasi", "Lokasi"],
  ["waktu", "Waktu"],
  ["pihakTerlibat", "Pihak Terlibat"],
  ["saksi", "Saksi"],
  ["buktiTambahan", "Bukti Tambahan"],
  ["harapanPelapor", "Harapan Pelapor"],
];

export const parseComplaintMessage = (message) => {
  const text = String(message || "").trim();
  if (!text) {
    return { raw: "", fields: [] };
  }

  const markers = complaintDetailLabels
    .map(([key, label]) => {
      const index = text.toLowerCase().indexOf(`${label.toLowerCase()}:`);
      return index >= 0 ? { key, label, index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);

  if (markers.length === 0) {
    return { raw: text, fields: [] };
  }

  const fields = markers.map((item, index) => {
    const prefix = `${item.label}:`;
    const start = item.index + prefix.length;
    const end = index < markers.length - 1 ? markers[index + 1].index : text.length;
    const value = text.slice(start, end).trim();

    return {
      key: item.key,
      label: item.label,
      value,
    };
  });

  return { raw: text, fields };
};

export const getUrgencyValue = (complaint) =>
  String(complaint?.urgency || complaint?.urgensi || "").trim();

export const getUrgencyBadgeClass = (value) => {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("tinggi") || normalized.includes("high")) {
    return "badge urgency urgency-high";
  }

  if (normalized.includes("sedang") || normalized.includes("medium")) {
    return "badge urgency urgency-medium";
  }

  if (normalized.includes("rendah") || normalized.includes("low")) {
    return "badge urgency urgency-low";
  }

  return "badge urgency";
};
