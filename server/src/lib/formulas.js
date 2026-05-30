// FORMULA_LIBRARY — di-port apa adanya dari src/App.jsx (§3).
// Fungsi `compute(v)` menerima objek nilai keyed by NAMA field (bukan id).
// Dipakai oleh scoring engine untuk menghitung field bertipe "auto".

export const FORMULA_LIBRARY = [
  { id: "sr",          inputs: ["Tebar", "Panen"],                 compute: (v) => v["Tebar"] > 0 ? (v["Panen"] / v["Tebar"] * 100) : 0 },
  { id: "fcr",         inputs: ["Pakan", "Berat_Panen"],           compute: (v) => v["Berat_Panen"] > 0 ? (v["Pakan"] / v["Berat_Panen"]) : 0 },
  { id: "hpp",         inputs: ["Total_Biaya", "Berat_Panen"],     compute: (v) => v["Berat_Panen"] > 0 ? (v["Total_Biaya"] / v["Berat_Panen"]) : 0 },
  { id: "omset",       inputs: ["Berat_Panen", "Harga_Jual"],      compute: (v) => (v["Berat_Panen"] || 0) * (v["Harga_Jual"] || 0) },
  { id: "margin",      inputs: ["Omset", "Total_Biaya"],           compute: (v) => (v["Omset"] || 0) - (v["Total_Biaya"] || 0) },
  { id: "margin_pct",  inputs: ["Margin", "Omset"],                compute: (v) => v["Omset"] > 0 ? (v["Margin"] / v["Omset"] * 100) : 0 },
  { id: "roi",         inputs: ["Margin", "Modal"],                compute: (v) => v["Modal"] > 0 ? (v["Margin"] / v["Modal"] * 100) : 0 },
  { id: "mortalitas",  inputs: ["Tebar", "Panen"],                 compute: (v) => v["Tebar"] > 0 ? ((v["Tebar"] - v["Panen"]) / v["Tebar"] * 100) : 0 },
  { id: "avg_per_trx", inputs: ["Omset", "Jumlah_Transaksi"],      compute: (v) => v["Jumlah_Transaksi"] > 0 ? (v["Omset"] / v["Jumlah_Transaksi"]) : 0 },
  { id: "aktivasi_agen", inputs: ["Agen_Aktif", "Total_Agen"],     compute: (v) => v["Total_Agen"] > 0 ? (v["Agen_Aktif"] / v["Total_Agen"] * 100) : 0 },

  // Reverse-direction formulas (input rasio → hitung nilai mentah)
  { id: "panen_dari_sr",     inputs: ["Tebar", "SR"],                       compute: (v) => (v["Tebar"] || 0) * (v["SR"] || 0) / 100 },
  { id: "berat_dari_bobot",  inputs: ["Bobot_per_Ekor", "Panen"],           compute: (v) => (v["Bobot_per_Ekor"] || 0) * (v["Panen"] || 0) / 1000 },
  { id: "pakan_dari_fcr",    inputs: ["FCR", "Berat_Panen"],                compute: (v) => (v["FCR"] || 0) * (v["Berat_Panen"] || 0) },
  { id: "populasi_dari_kg",  inputs: ["Kg_Tebar", "Ukuran_Tebar"],          compute: (v) => (v["Ukuran_Tebar"] || 0) > 0 ? (v["Kg_Tebar"] || 0) * 1000 / v["Ukuran_Tebar"] : 0 },
  { id: "hpp_benih_ekor",    inputs: ["Harga_Benih_per_ekor", "Tebar"],     compute: (v) => (v["Harga_Benih_per_ekor"] || 0) * (v["Tebar"] || 0) },
  { id: "hpp_benih_kg",      inputs: ["Harga_Benih_per_kg", "Kg_Tebar"],    compute: (v) => (v["Harga_Benih_per_kg"] || 0) * (v["Kg_Tebar"] || 0) },
  { id: "hpp_pakan",         inputs: ["Harga_Pakan", "Pakan"],              compute: (v) => (v["Harga_Pakan"] || 0) * (v["Pakan"] || 0) },
  {
    id: "total_biaya_komponen",
    inputs: ["Biaya_Borongan_Panen", "Biaya_per_kg_Panen", "Biaya_Pemeliharaan_per_kg", "Berat_Panen", "Biaya_CapEx", "Biaya_Lain-lain", "HPP_Benih", "HPP_Pakan"],
    compute: (v) =>
      (v["Biaya_Borongan_Panen"] || 0) +
      ((v["Biaya_per_kg_Panen"] || 0) + (v["Biaya_Pemeliharaan_per_kg"] || 0)) * (v["Berat_Panen"] || 0) +
      (v["Biaya_CapEx"] || 0) +
      (v["Biaya_Lain-lain"] || 0) +
      (v["HPP_Benih"] || 0) +
      (v["HPP_Pakan"] || 0),
  },
  { id: "hpp_dari_total",    inputs: ["Total_Biaya", "Berat_Panen"],        compute: (v) => v["Berat_Panen"] > 0 ? (v["Total_Biaya"] / v["Berat_Panen"]) : 0 },
  { id: "margin_dari_total", inputs: ["Omset", "Total_Biaya"],              compute: (v) => (v["Omset"] || 0) - (v["Total_Biaya"] || 0) },
];

const FORMULA_BY_ID = Object.fromEntries(FORMULA_LIBRARY.map((f) => [f.id, f]));

export function getFormula(formulaId) {
  return FORMULA_BY_ID[formulaId] || null;
}
