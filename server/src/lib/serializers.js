// Konversi baris DB (snake_case) -> bentuk API (camelCase) yang dipakai frontend.

export const unitToApi = (r) => ({
  id: r.id,
  name: r.name,
  leaderId: r.leader_id,
  color: r.color,
  colorDark: r.color_dark,
  colorLight: r.color_light,
  icon: r.icon,
});

export const subUnitToApi = (r) => ({
  id: r.id,
  unitId: r.unit_id,
  name: r.name,
  picId: r.pic_id,
  icon: r.icon,
  status: r.status,
  weight: r.weight,
  createdAt: r.created_at,
});

export const projectToApi = (r) => ({
  id: r.id,
  unitId: r.unit_id,
  subUnitId: r.sub_unit_id,
  name: r.name,
  desc: r.description,
  status: r.status,
  milestonesTotal: r.milestones_total,
  milestonesDone: r.milestones_done,
  budgetPlanned: Number(r.budget_planned),
  budgetSpent: Number(r.budget_spent),
  startDate: r.start_date,
  endDate: r.end_date,
});

export const userToApi = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  avatar: r.avatar,
  unitId: r.unit_id,
  subUnitId: r.sub_unit_id,
});

export const milestoneToApi = (r) => ({
  id: r.id,
  projectId: r.project_id,
  name: r.name,
  done: r.done,
  date: r.date,
  pic: r.pic,
  budgetAllocated: Number(r.budget_allocated),
});

export const expenseToApi = (r) => ({
  id: r.id,
  projectId: r.project_id,
  milestoneId: r.milestone_id,
  name: r.name,
  amount: Number(r.amount),
  date: r.date,
  hasReceipt: r.has_receipt,
});

export const auditToApi = (r) => ({
  id: r.id,
  ts: r.ts,
  actorId: r.actor_id,
  action: r.action,
  entityType: r.entity_type,
  entityId: r.entity_id,
  entityLabel: r.entity_label,
  unitId: r.unit_id,
  details: r.details,
  diff: r.diff,
});
