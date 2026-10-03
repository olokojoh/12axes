const apiToken = process.env.CLOUDFLARE_API_TOKEN;
if (!apiToken) throw new Error("CLOUDFLARE_API_TOKEN is required");

const account = "cbc3bde77f12dad362c481794bb7e314";
const failedQueue = "68240e6d86004579a3fd0973483a6090";
const deliveryQueue = "281536b45c3f40f89382fec5dd018434";
const database = "d8c10371-80f7-4147-a1da-c337c5764757";

async function request(path, body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, {
    method: "POST",
    headers: { authorization: "Bearer " + apiToken, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error("Queue recovery failed (HTTP " + response.status + ")");
  return data.result;
}

const batch = await request(`queues/${failedQueue}/messages/pull`, { visibility_timeout_ms: 60000, batch_size: 10 });
let retried = 0, skipped = 0;
for (const message of batch.messages) {
  // HTTP-produced JSON can arrive as plain JSON; Worker-produced JSON can be base64.
  let job;
  try {
    job = JSON.parse(message.body.startsWith("{") ? message.body : Buffer.from(message.body, "base64").toString("utf8"));
  } catch {
    throw new Error("Undecodable delivery job; left in the failed queue for inspection");
  }
  if (!/^[a-f0-9-]{36}$/i.test(job.orderId ?? "") || typeof job.deliveryId !== "string" || !job.deliveryId.startsWith("paid/" + job.orderId) && !job.deliveryId.startsWith("recover/" + job.orderId + "/")) {
    throw new Error("Unexpected delivery job; left in the failed queue for inspection");
  }
  const rows = await request(`d1/database/${database}/query`, {
    sql: "SELECT status, email_sent_at FROM orders WHERE id = ?", params: [job.orderId],
  });
  const order = rows[0].results[0];
  if (order?.status === "paid" && (job.deliveryId.startsWith("recover/") || !order.email_sent_at)) {
    await request(`queues/${deliveryQueue}/messages`, { body: job, content_type: "json" });
    retried++;
  } else {
    skipped++;
  }
  await request(`queues/${failedQueue}/messages/ack`, { acks: [{ lease_id: message.lease_id }], retries: [] });
}
console.log({ retried, skipped, backlogAtPull: batch.message_backlog_count, note: "Run again if a backlog remains. Provider acceptance does not guarantee inbox delivery." });
