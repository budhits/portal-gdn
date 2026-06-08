// Rute Peta Jalan / Grand Plan: node + koneksi (panah) di kanvas utama & anak
// kanvas (parent_id). Baca untuk semua; tulis hanya Owner/Admin/Leader.

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

const nodeToApi = (r) => ({
  id: r.id, parentId: r.parent_id || null, label: r.label, status: r.status,
  targetMonth: r.target_month || "", picUserId: r.pic_user_id || null,
  projectId: r.project_id || null, posX: Number(r.pos_x) || 0, posY: Number(r.pos_y) || 0,
});
const edgeToApi = (r) => ({ id: r.id, parentId: r.parent_id || null, sourceId: r.source_id, targetId: r.target_id });

const msToApi = (r) => ({ id: r.id, nodeId: r.node_id, label: r.label, done: !!r.done,
  picUserId: r.pic_user_id || null, targetMonth: r.target_month || "" });

const nid = () => `rn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const eid = () => `re-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const mid = () => `rm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

async function canEdit(userId) {
  const { rows } = await query("SELECT role FROM users WHERE id = $1", [userId]);
  return ["admin", "owner", "leader"].includes(rows[0]?.role);
}
async function guard(req, res) {
  if (!(await canEdit(req.user.id))) {
    res.status(403).json({ error: "Hanya Owner/Admin/Leader yang boleh mengubah Peta Jalan." });
    return false;
  }
  return true;
}

// GET /api/roadmap?parentId=  → { nodes, edges } untuk satu kanvas (default: utama)
router.get("/", async (req, res, next) => {
  try {
    const parentId = req.query.parentId || null;
    const cond = parentId ? "parent_id = $1" : "parent_id IS NULL";
    const params = parentId ? [parentId] : [];
    const [n, e] = await Promise.all([
      query(`SELECT * FROM roadmap_nodes WHERE ${cond} ORDER BY created_at`, params),
      query(`SELECT * FROM roadmap_edges WHERE ${cond} ORDER BY created_at`, params),
    ]);
    const nodes = n.rows.map(nodeToApi);
    const ids = nodes.map((x) => x.id);
    if (ids.length) {
      const [ms, ch] = await Promise.all([
        query("SELECT * FROM roadmap_milestones WHERE node_id = ANY($1) ORDER BY sort_order, created_at", [ids]),
        query("SELECT parent_id, COUNT(*)::int AS c FROM roadmap_nodes WHERE parent_id = ANY($1) GROUP BY parent_id", [ids]),
      ]);
      const byNode = {}; ms.rows.forEach((m) => { (byNode[m.node_id] = byNode[m.node_id] || []).push(msToApi(m)); });
      const childMap = {}; ch.rows.forEach((c) => { childMap[c.parent_id] = c.c; });
      nodes.forEach((nd) => { nd.milestones = byNode[nd.id] || []; nd.childCount = childMap[nd.id] || 0; });
    }
    res.json({ nodes, edges: e.rows.map(edgeToApi) });
  } catch (err) { next(err); }
});

// POST /api/roadmap/nodes
router.post("/nodes", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const b = req.body || {};
    const id = nid();
    const { rows } = await query(
      `INSERT INTO roadmap_nodes (id, parent_id, label, status, target_month, pic_user_id, project_id, pos_x, pos_y)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, b.parentId || null, (b.label || "Inisiatif baru").trim(),
       b.status || "planned", b.targetMonth || null, b.picUserId || null, b.projectId || null,
       Number(b.posX) || 0, Number(b.posY) || 0]
    );
    res.status(201).json(nodeToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/roadmap/nodes/:id
router.patch("/nodes/:id", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const map = { label: "label", status: "status", targetMonth: "target_month",
      picUserId: "pic_user_id", projectId: "project_id", posX: "pos_x", posY: "pos_y" };
    const sets = []; const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) { params.push(req.body[k] === "" ? null : req.body[k]); sets.push(`${col} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: "Tidak ada perubahan." });
    params.push(req.params.id);
    const { rows } = await query(`UPDATE roadmap_nodes SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    if (!rows[0]) return res.status(404).json({ error: "Node tidak ditemukan." });
    res.json(nodeToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/roadmap/nodes/:id  (+ bersihkan panah & anak kanvas terkait)
router.delete("/nodes/:id", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const id = req.params.id;
    await query("DELETE FROM roadmap_edges WHERE source_id = $1 OR target_id = $1", [id]);
    await query("DELETE FROM roadmap_milestones WHERE node_id = $1", [id]);
    await query("DELETE FROM roadmap_nodes WHERE parent_id = $1", [id]); // anak kanvas isi node
    await query("DELETE FROM roadmap_edges WHERE parent_id = $1", [id]);
    await query("DELETE FROM roadmap_nodes WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/roadmap/edges  { parentId?, sourceId, targetId }
router.post("/edges", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const { parentId = null, sourceId, targetId } = req.body || {};
    if (!sourceId || !targetId) return res.status(400).json({ error: "sourceId & targetId wajib." });
    if (sourceId === targetId) return res.status(400).json({ error: "Tidak bisa menyambung ke diri sendiri." });
    const id = eid();
    const { rows } = await query(
      "INSERT INTO roadmap_edges (id, parent_id, source_id, target_id) VALUES ($1,$2,$3,$4) RETURNING *",
      [id, parentId, sourceId, targetId]
    );
    res.status(201).json(edgeToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/roadmap/edges/:id
router.delete("/edges/:id", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    await query("DELETE FROM roadmap_edges WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── Milestone kecil per node ─────────────────────────────────────────────────
// POST /api/roadmap/nodes/:id/milestones  { label, picUserId?, targetMonth? }
router.post("/nodes/:id/milestones", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const b = req.body || {};
    const { rows: ord } = await query("SELECT COALESCE(MAX(sort_order)+1,0) AS n FROM roadmap_milestones WHERE node_id = $1", [req.params.id]);
    const id = mid();
    const { rows } = await query(
      `INSERT INTO roadmap_milestones (id, node_id, label, done, pic_user_id, target_month, sort_order)
       VALUES ($1,$2,$3,false,$4,$5,$6) RETURNING *`,
      [id, req.params.id, (b.label || "Tugas baru").trim(), b.picUserId || null, b.targetMonth || null, ord[0].n]
    );
    res.status(201).json(msToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/roadmap/milestones/:mid  { label?, done?, picUserId?, targetMonth? }
router.patch("/milestones/:mid", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const map = { label: "label", done: "done", picUserId: "pic_user_id", targetMonth: "target_month" };
    const sets = []; const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) { params.push(req.body[k] === "" ? null : req.body[k]); sets.push(`${col} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: "Tidak ada perubahan." });
    params.push(req.params.mid);
    const { rows } = await query(`UPDATE roadmap_milestones SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    if (!rows[0]) return res.status(404).json({ error: "Milestone tidak ditemukan." });
    res.json(msToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/roadmap/milestones/:mid
router.delete("/milestones/:mid", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    await query("DELETE FROM roadmap_milestones WHERE id = $1", [req.params.mid]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
