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
];

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
