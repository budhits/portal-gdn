// Rute KPI submissions (read): daftar & detail, dengan skor/margin turunan.

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getSubmissions, getSubmissionById, getTemplatesMap, enrichSubmission } from "../lib/repository.js";

const router = Router();
router.use(authenticate);

// GET /api/submissions?unitId=&subUnitId=&status=
router.get("/", async (req, res, next) => {
  try {
    const filters = {
      unitId: req.query.unitId,
      subUnitId: req.query.subUnitId,
      status: req.query.status,
      createdBy: req.query.createdBy,
    };
    const [subs, templates] = await Promise.all([getSubmissions(filters), getTemplatesMap()]);
    res.json(subs.map((s) => enrichSubmission(s, templates)));
  } catch (err) { next(err); }
});

// GET /api/submissions/:id
router.get("/:id", async (req, res, next) => {
  try {
    const [sub, templates] = await Promise.all([getSubmissionById(req.params.id), getTemplatesMap()]);
    if (!sub) return res.status(404).json({ error: "Submission tidak ditemukan." });
    res.json(enrichSubmission(sub, templates));
  } catch (err) { next(err); }
});

export default router;
