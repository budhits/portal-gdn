// Isi database dengan data demo dari seed-data.js.
// Pemakaian: npm run db:seed   (dari folder server/)
//
// Urutan insert dirancang untuk menghindari konflik foreign key melingkar
// (users <-> units <-> sub_units):
//   1. users tanpa unit_id/sub_unit_id
//   2. units, lalu sub_units
//   3. update users -> isi unit_id & sub_unit_id
//   4. projects, form_templates, form_fields, kpi_submissions, audit_log

import bcrypt from "bcryptjs";
import { withTransaction, pool } from "../src/db.js";
import {
  USERS, UNITS, SUB_UNITS, PROJECTS, MILESTONES, EXPENSES,
  FORM_TEMPLATES, KPI_SUBMISSIONS, AUDIT_LOG,
} from "./seed-data.js";

// Password demo mengikuti pola `<id>123`.
const passwordFor = (userId) => `${userId}123`;

async function seed() {
  await withTransaction(async (c) => {
    // Bersihkan dulu (urutan terbalik dari dependensi).
    await c.query("TRUNCATE audit_log, kpi_submissions, form_fields, form_templates, expenses, milestones, projects, sub_units, units, users RESTART IDENTITY CASCADE");

    // 1. users (tanpa referensi unit/sub_unit dulu)
    for (const u of USERS) {
      const hash = await bcrypt.hash(passwordFor(u.id), 10);
      await c.query(
        `INSERT INTO users (id, name, email, password_hash, role, avatar)
         VALUES ($1, $2, $3, $4, $5, '')`,
        [u.id, u.name, u.email, hash, u.role]
      );
    }

    // 2a. units
    for (const u of UNITS) {
      await c.query(
        `INSERT INTO units (id, name, leader_id, color, color_dark, color_light, icon)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.id, u.name, u.leaderId, u.color, u.colorDark, u.colorLight, u.icon]
      );
    }

    // 2b. sub_units
    for (const s of SUB_UNITS) {
      await c.query(
        `INSERT INTO sub_units (id, unit_id, name, pic_id, icon, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [s.id, s.unitId, s.name, s.picId, s.icon, s.status, s.createdAt]
      );
    }

    // 3. lengkapi unit_id & sub_unit_id pada users
    for (const u of USERS) {
      if (u.unitId || u.subUnitId) {
        await c.query(
          `UPDATE users SET unit_id = $2, sub_unit_id = $3 WHERE id = $1`,
          [u.id, u.unitId, u.subUnitId]
        );
      }
    }

    // 4a. projects
    for (const p of PROJECTS) {
      await c.query(
        `INSERT INTO projects (id, unit_id, sub_unit_id, name, description, status,
            milestones_total, milestones_done, budget_planned, budget_spent, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [p.id, p.unitId, p.subUnitId, p.name, p.desc, p.status,
         p.milestonesTotal, p.milestonesDone, p.budgetPlanned, p.budgetSpent, p.startDate, p.endDate]
      );
    }

    // 4b. form_templates + form_fields
    for (const t of FORM_TEMPLATES) {
      await c.query(
        `INSERT INTO form_templates (id, name, description, frequency, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [t.id, t.name, t.description, t.frequency, t.createdAt]
      );
      let order = 0;
      for (const f of t.fields) {
        await c.query(
          `INSERT INTO form_fields (template_id, field_key, name, type, satuan, source,
              formula_id, default_weight, is_margin, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [t.id, f.id, f.name, f.type, f.satuan, f.source, f.formulaId, f.defaultWeight, f.isMargin, order++]
        );
      }
    }

    // 4b-2. milestones (urut per project untuk sort_order)
    const msOrder = {};
    for (const m of MILESTONES) {
      const ord = (msOrder[m.projectId] = (msOrder[m.projectId] ?? -1) + 1);
      await c.query(
        `INSERT INTO milestones (id, project_id, name, done, date, pic, budget_allocated, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [m.id, m.projectId, m.name, m.done, m.date, m.pic, m.budgetAllocated, ord]
      );
    }

    // 4b-3. expenses
    for (const e of EXPENSES) {
      await c.query(
        `INSERT INTO expenses (id, project_id, milestone_id, name, amount, date, has_receipt)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [e.id, e.projectId, e.milestoneId, e.name, e.amount, e.date, e.hasReceipt]
      );
    }

    // 4c. kpi_submissions
    for (const s of KPI_SUBMISSIONS) {
      await c.query(
        `INSERT INTO kpi_submissions (id, template_id, sub_unit_id, unit_id, status, period,
            estimated_values, actual_values, field_weights, sub_unit_weight,
            created_by, created_at, approved_by, approved_at, closed_at, closing_note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [s.id, s.templateId, s.subUnitId, s.unitId, s.status, s.period,
         JSON.stringify(s.estimatedValues), s.actualValues ? JSON.stringify(s.actualValues) : null,
         JSON.stringify(s.fieldWeights), s.subUnitWeight,
         s.createdBy, s.createdAt, s.approvedBy, s.approvedAt, s.closedAt, s.closingNote]
      );
    }

    // 4d. audit_log
    for (const a of AUDIT_LOG) {
      await c.query(
        `INSERT INTO audit_log (ts, actor_id, action, entity_type, entity_id, entity_label, unit_id, details, diff)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [a.ts, a.actorId, a.action, a.entityType, a.entityId, a.entityLabel, a.unitId, a.details,
         a.diff ? JSON.stringify(a.diff) : null]
      );
    }
  });

  // Ringkasan
  const counts = {};
  for (const tbl of ["users", "units", "sub_units", "projects", "milestones", "expenses", "form_templates", "form_fields", "kpi_submissions", "audit_log"]) {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${tbl}`);
    counts[tbl] = rows[0].n;
  }
  console.log("✅ Seed selesai. Jumlah baris per tabel:");
  console.table(counts);
  console.log("\n🔑 Login demo (pola password = <id>123), contoh:");
  console.log("   Owner : budhi@email.com  / budhi123");
  console.log("   Leader: satya@email.com  / satya123");
  console.log("   PIC   : rafli@email.com  / rafli123");
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error("❌ Seed gagal:", err);
    pool.end();
    process.exit(1);
  });
