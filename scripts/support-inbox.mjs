import { readFile } from "node:fs/promises";
import { decryptPayload } from "../app/lib/secure-payload.ts";

const [action = "list", id] = process.argv.slice(2);
if (!["list", "show", "resolve", "delete-report", "delete-share"].includes(action) || (action !== "list" && !(action === "delete-share" ? /^[A-Za-z0-9_-]{32,128}$/ : /^[a-f0-9-]{36}$/i).test(id ?? ""))) {
  throw new Error("Usage: node --experimental-strip-types scripts/support-inbox.mjs list | show <request-id> | resolve <request-id> | delete-report <order-id> | delete-share <share-id>");
}
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) throw new Error("CLOUDFLARE_API_TOKEN is required");

const sql = action === "list"
  ? "SELECT id, created_at FROM support_requests WHERE resolved_at IS NULL ORDER BY created_at LIMIT 100"
  : action === "show"
    ? "SELECT payload FROM support_requests WHERE id = ?"
    : action === "delete-report"
      ? "UPDATE orders SET status = 'revoked', payload = '', token_payload = '', token_hash = ?, customer_email = NULL, revoked_at = ?, updated_at = ? WHERE id = ?"
      : action === "delete-share"
        ? "DELETE FROM shared_results WHERE id = ?"
        : "UPDATE support_requests SET resolved_at = ? WHERE id = ?";
const now = Math.floor(Date.now() / 1000);
const params = action === "list" ? [] : action === "show" || action === "delete-share" ? [id] : action === "delete-report" ? ["deleted/" + crypto.randomUUID(), now, now, id] : [now, id];
const response = await fetch("https://api.cloudflare.com/client/v4/accounts/cbc3bde77f12dad362c481794bb7e314/d1/database/d8c10371-80f7-4147-a1da-c337c5764757/query", {
  method: "POST",
  headers: { authorization: "Bearer " + token, "content-type": "application/json" },
  body: JSON.stringify({ sql, params }),
});
const result = await response.json();
if (!response.ok || !result.success) throw new Error("Support inbox query failed (HTTP " + response.status + ")");
const rows = result.result[0].results;
if (action === "list") console.table(rows.map((row) => ({ id: row.id, received: new Date(row.created_at * 1000).toISOString() })));
if (action === "show") {
  if (!rows.length) throw new Error("Request not found");
  const { REPORT_ENCRYPTION_KEY: secret } = JSON.parse(await readFile(new URL("../.openai/billing-secrets.json", import.meta.url), "utf8"));
  console.log(JSON.stringify(await decryptPayload(rows[0].payload, secret), null, 2));
}
if (action === "resolve") console.log("Marked handled. This command does not issue a refund or delete a report.");
if (action === "delete-report" || action === "delete-share") console.log({ action, changed: result.result[0].meta.changes });
