export const complaintDetailLabels = [
  ["kronologi", "Kronologi"],
  ["lokasi", "Lokasi"],
  ["waktu", "Waktu"],
  ["pihakTerlibat", "Pihak Terlibat"],
  ["saksi", "Saksi"],
  ["buktiTambahan", "Bukti Tambahan"],
  ["harapanPelapor", "Harapan Pelapor"],
];

export const adminNavItems = [
  {
    value: "dashboard",
    label: "Dashboard",
    description: "Ringkasan kondisi laporan dan akun",
  },
  {
    value: "account-requests",
    label: "Pengajuan Akun",
    description: "Verifikasi permohonan akun siswa",
  },
  {
    value: "student-accounts",
    label: "Data Akun Siswa",
    description: "Akun siswa yang sudah tercatat",
  },
  {
    value: "complaints",
    label: "Pengaduan",
    description: "Tindak lanjut laporan masuk",
  },
  {
    value: "insight",
    label: "Insight Dataset",
    description: "Dataset referensi bullying 2018",
  },
];

const datasetLabelMap = {
  "13 years old": "13 tahun",
  "14 years old": "14 tahun",
  "15 years old": "15 tahun",
  "16 years old": "16 tahun",
  "17 years old": "17 tahun",
  "18 years old or older": "18 tahun atau lebih",
  Female: "Perempuan",
  Male: "Laki-laki",
  Never: "Tidak pernah",
  Rarely: "Jarang",
  Sometimes: "Kadang-kadang",
  "Most of the time": "Sering",
  Always: "Selalu",
  "0 days": "0 hari",
  "1 or 2 days": "1-2 hari",
  "3 to 5 days": "3-5 hari",
  "6 to 9 days": "6-9 hari",
  "10 or more days": "10 hari atau lebih",
};

const localizeDatasetLabel = (value) => datasetLabelMap[value] || value;

export const normalizeDatasetItems = (items) =>
  Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        label: localizeDatasetLabel(item.label),
      }))
    : [];

export const formatRespondentCount = (value) =>
  `${Number(value || 0).toLocaleString("id-ID")} responden`;

export const formatPercentage = (value) =>
  `${Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

export const splitComplaintMessage = (message) => {
  const text = String(message || "").trim();
  if (!text) {
    return { raw: "", fields: [] };
  }

  const fields = [];
  const patterns = complaintDetailLabels.map(([key, label]) => ({
    key,
    label,
    pattern: new RegExp(`${label}:`, "i"),
  }));

  const matches = [];
  patterns.forEach(({ key, label, pattern }) => {
    const match = text.match(pattern);
    if (match) {
      matches.push({ key, label, index: match.index });
    }
  });

  if (matches.length === 0) {
    return { raw: text, fields: [] };
  }

  const sorted = matches.sort((a, b) => a.index - b.index);
  sorted.forEach((item, index) => {
    const start = item.index + `${item.label}:`.length;
    const end = index < sorted.length - 1 ? sorted[index + 1].index : text.length;
    const value = text.slice(start, end).trim();
    fields.push({ key: item.key, label: item.label, value });
  });

  return { raw: text, fields };
};
