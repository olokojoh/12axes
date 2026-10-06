import { decryptPayload, hashToken } from "./secure-payload";
import type { QuizEvidence } from "./quiz-evidence";

export type ReportPlan = "basic" | "plus" | "deep";
export const planAmounts = { basic: 499, plus: 999, deep: 1499 };
export type ReportOrder = { id: string; status: string; payload: string; locale: string; quiz_length: number; variant: string; plan: ReportPlan; parent_order_id: string | null; dependency_order_id: string | null; checkout_session_id: string | null; delivery_base_url: string };
type ReportPayload = { axes: number[]; evidence?: QuizEvidence };

export async function reportAccess(db: D1Database, token: string, secret: string, original = false) {
  const order = await db.prepare("SELECT * FROM orders WHERE token_hash = ?").bind(await hashToken(token)).first<ReportOrder>();
  if (!order || order.status !== "paid") return null;
  const root = order.parent_order_id ? await db.prepare("SELECT * FROM orders WHERE id = ?").bind(order.parent_order_id).first<ReportOrder>() : order;
  if (!root || root.status !== "paid") return null;
  const { results: upgrades } = await db.prepare("SELECT * FROM orders WHERE parent_order_id = ? AND status = 'paid' ORDER BY expected_amount DESC, created_at DESC").bind(root.id).all<ReportOrder>();
  const available = [root, ...upgrades.filter(item => !item.dependency_order_id || item.dependency_order_id === root.id || upgrades.some(parent => parent.id === item.dependency_order_id))];
  available.sort((a, b) => planAmounts[b.plan] - planAmounts[a.plan]);
  const entitlement = available[0];
  const selected = original ? available.find(item => item.plan !== "deep") ?? root : entitlement;
  const payload = await decryptPayload<ReportPayload>((selected.plan === "deep" ? selected : root).payload, secret);
  return { root, axes: payload.axes, evidence: payload.evidence, quizLength: selected.plan === "deep" ? selected.quiz_length : root.quiz_length, plan: selected.plan, entitlement, hasOriginal: entitlement.plan === "deep" && root.plan !== "deep" };
}
