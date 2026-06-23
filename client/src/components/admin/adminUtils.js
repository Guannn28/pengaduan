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

const datasetCommonLabelMap = {
  Yes: "Ya",
  No: "Tidak",
  Male: "Laki-laki",
  Female: "Perempuan",
  "0 times": "0 kali",
  "1 time": "1 kali",
  "2 or 3 times": "2-3 kali",
  "4 or 5 times": "4-5 kali",
  "6 or 7 times": "6-7 kali",
  "8 or 9 times": "8-9 kali",
  "10 or 11 times": "10-11 kali",
  "12 or more times": "12 kali atau lebih",
  "11 years old or younger": "11 tahun atau lebih muda",
  "12 years old": "12 tahun",
  "13 years old": "13 tahun",
  "14 years old": "14 tahun",
  "15 years old": "15 tahun",
  "16 years old": "16 tahun",
  "17 years old": "17 tahun",
  "18 years old or older": "18 tahun atau lebih",
  Never: "Tidak pernah",
  Rarely: "Jarang",
  Sometimes: "Kadang-kadang",
  "Most of the time": "Sering",
  Always: "Selalu",
};

const datasetContextLabelMaps = {
  closeFriends: {
    0: "0 teman dekat",
    1: "1 teman dekat",
    2: "2 teman dekat",
    "3 or more": "3 atau lebih teman dekat",
  },
  missedClasses: {
    "0 days": "0 hari",
    "1 or 2 days": "1-2 hari",
    "3 to 5 days": "3-5 hari",
    "6 to 9 days": "6-9 hari",
    "10 or more days": "10 hari atau lebih",
  },
};

const localizeDatasetLabel = (value, contextKey) => {
  const label = String(value ?? "");
  const contextMap = datasetContextLabelMaps[contextKey] || {};
  return contextMap[label] || datasetCommonLabelMap[label] || label;
};

export const normalizeDatasetItems = (items, contextKey) =>
  Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        label: localizeDatasetLabel(item.label, contextKey),
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
