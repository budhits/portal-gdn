// Kosongkan data trial: Project (+milestone+expense), KPI submission (margin
// turunan ikut kosong). TIDAK menyentuh user, unit, sub-unit, template, audit.
// Pemakaian CLI: node db/clear-trial.js   (atau: npm run db:clear-trial)

import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

export async function clearTrialData(runner) {
  const q = runner ? runner.query.bind(runner) : pool.query.bind(pool);
  // Urutan aman terhadap foreign key.
  await q("DELETE FROM expenses");
  await q("DELETE FROM milestones");
  await q("DELETE FROM projects");
  await q("DELETE FROM kpi_submissions"); // margin = turunan, ikut kosong
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  clearTrialData()
    .then(async () => {
      console.log("✅ Project, KPI, & Margin dikosongkan. User/Unit/Sub-unit/Template/Audit tetap.");
      await pool.end();
    })
    .catch((err) => {
      console.error("❌ Gagal mengosongkan data trial:", err.message);
      pool.end();
      process.exit(1);
    });
}
