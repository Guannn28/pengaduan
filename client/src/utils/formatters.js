export const resolveMediaUrl = (value, apiUrl) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiUrl}${value}`;
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
};

export const getStatusLabel = (statusOptions, status) =>
  statusOptions.find((option) => option.value === status)?.label ?? status ?? "-";

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
