// Rute Peta Jalan / Grand Plan. Model "canvas": node/edge berada di sebuah
// canvas (canvas_id NULL = utama). Satu node bisa punya >1 anak kanvas
// (roadmap_canvases.owner_node_id). Baca untuk semua; tulis Owner/Admin/Leader.

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

const nodeToApi = (r) => ({
  id: r.id, canvasId: r.canvas_id || null, label: r.label, status: r.status,
  targetMonth: r.target_month || "", picUserId: r.pic_user_id || null,
  projectId: r.project_id || null, posX: Number(r.pos_x) || 0, posY: Number(r.pos_y) || 0,
});
const edgeToApi = (r) => ({ id: r.id, canvasId: r.canvas_id || null, sourceId: r.source_id, targetId: r.target_id });
const msToApi = (r) => ({ id: r.id, nodeId: r.node_id, label: r.label, done: !!r.done,
  picUserId: r.pic_user_id || null, targetMonth: r.target_month || "" });
const canvasToApi = (r) => ({ id: r.id, ownerNodeId: r.owner_node_id || null, name: r.name,
  posX: Number(r.pos_x) || 0, posY: Number(r.pos_y) || 0 });

const nid = () => `rn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const eid = () => `re-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const mid = () => `rm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const cid = () => `rc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

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

// Hapus node beserta seluruh anak kanvas yang dimilikinya (rekursif).
async function deleteNodeDeep(id) {
  const { rows: owned } = await query("SELECT id FROM roadmap_canvases WHERE owner_node_id = $1", [id]);
  for (const c of owned) {
    const { rows: childNodes } = await query("SELECT id FROM roadmap_nodes WHERE canvas_id = $1", [c.id]);
    for (const cn of childNodes) await deleteNodeDeep(cn.id);
    await query("DELETE FROM roadmap_edges WHERE canvas_id = $1", [c.id]);
    await query("DELETE FROM roadmap_canvases WHERE id = $1", [c.id]);
  }
  await query("DELETE FROM roadmap_milestones WHERE node_id = $1", [id]);
  await query("DELETE FROM roadmap_edges WHERE source_id = $1 OR target_id = $1", [id]);
  await query("DELETE FROM roadmap_nodes WHERE id = $1", [id]);
}

// GET /api/roadmap → SELURUH pohon (semua node, edge, canvas) untuk dirender di
// satu kanvas: anak kanvas tampil sebagai box dengan node di dalamnya.
router.get("/", async (_req, res, next) => {
  try {
    const [n, e, c] = await Promise.all([
      query("SELECT * FROM roadmap_nodes ORDER BY created_at"),
      query("SELECT * FROM roadmap_edges ORDER BY created_at"),
      query("SELECT * FROM roadmap_canvases ORDER BY created_at"),
    ]);
    const nodes = n.rows.map(nodeToApi);
    const ids = nodes.map((x) => x.id);
    if (ids.length) {
      const ms = await query("SELECT * FROM roadmap_milestones WHERE node_id = ANY($1) ORDER BY sort_order, created_at", [ids]);
      const byNode = {}; ms.rows.forEach((m) => { (byNode[m.node_id] = byNode[m.node_id] || []).push(msToApi(m)); });
      nodes.forEach((nd) => { nd.milestones = byNode[nd.id] || []; });
    }
    res.json({ nodes, edges: e.rows.map(edgeToApi), canvases: c.rows.map(canvasToApi) });
  } catch (err) { next(err); }
});

// POST /api/roadmap/nodes  { canvasId?, label, status, targetMonth, picUserId, projectId, posX, posY }
router.post("/nodes", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const b = req.body || {};
    const id = nid();
    const { rows } = await query(
      `INSERT INTO roadmap_nodes (id, canvas_id, label, status, target_month, pic_user_id, project_id, pos_x, pos_y)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, b.canvasId || null, (b.label || "Inisiatif baru").trim(),
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

// DELETE /api/roadmap/nodes/:id  (rekursif: anak kanvas, panah, milestone)
router.delete("/nodes/:id", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    await deleteNodeDeep(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/roadmap/edges  { canvasId?, sourceId, targetId }
router.post("/edges", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const { canvasId = null, sourceId, targetId } = req.body || {};
    if (!sourceId || !targetId) return res.status(400).json({ error: "sourceId & targetId wajib." });
    if (sourceId === targetId) return res.status(400).json({ error: "Tidak bisa menyambung ke diri sendiri." });
    const id = eid();
    const { rows } = await query(
      "INSERT INTO roadmap_edges (id, canvas_id, source_id, target_id) VALUES ($1,$2,$3,$4) RETURNING *",
      [id, canvasId, sourceId, targetId]
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

// ── Anak kanvas (canvas) ──────────────────────────────────────────────────────
// POST /api/roadmap/canvases  { ownerNodeId, name }
router.post("/canvases", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const { ownerNodeId, name, posX, posY } = req.body || {};
    if (!ownerNodeId) return res.status(400).json({ error: "ownerNodeId wajib." });
    const id = cid();
    const { rows } = await query(
      "INSERT INTO roadmap_canvases (id, owner_node_id, name, pos_x, pos_y) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [id, ownerNodeId, (name || "Anak Kanvas").trim(), Number(posX) || 0, Number(posY) || 0]
    );
    res.status(201).json(canvasToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/roadmap/canvases/:id  { name?, posX?, posY? }
router.patch("/canvases/:id", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const map = { name: "name", posX: "pos_x", posY: "pos_y" };
    const sets = []; const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: "Tidak ada perubahan." });
    params.push(req.params.id);
    const { rows } = await query(`UPDATE roadmap_canvases SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    if (!rows[0]) return res.status(404).json({ error: "Anak kanvas tidak ditemukan." });
    res.json(canvasToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/roadmap/canvases/:id  (+ semua node/edge di dalamnya, rekursif)
router.delete("/canvases/:id", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    const { rows: childNodes } = await query("SELECT id FROM roadmap_nodes WHERE canvas_id = $1", [req.params.id]);
    for (const cn of childNodes) await deleteNodeDeep(cn.id);
    await query("DELETE FROM roadmap_edges WHERE canvas_id = $1", [req.params.id]);
    await query("DELETE FROM roadmap_canvases WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── Milestone kecil per node ─────────────────────────────────────────────────
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

router.delete("/milestones/:mid", async (req, res, next) => {
  try {
    if (!(await guard(req, res))) return;
    await query("DELETE FROM roadmap_milestones WHERE id = $1", [req.params.mid]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
