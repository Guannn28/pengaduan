export const detailLabels = [
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

  const markers = detailLabels
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
