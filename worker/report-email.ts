import { decryptPayload } from "../app/lib/secure-payload";

type EmailJob = { orderId: string; deliveryId: string };
type EmailEnv = { DB: D1Database; REPORT_ENCRYPTION_KEY: string; RESEND_API_KEY: string; REPORT_FROM_EMAIL: string; PUBLIC_BASE_URL: string };

const message = {
  en: ["Your 12Axes report", "Your report is ready", "Open report", "Keep this private link. Anyone with the link can view the report.", "You received this email because you purchased a report or requested its access link on 12Axes.", "Help or refunds"],
  pt: ["Seu relatório 12Axes", "Seu relatório está pronto", "Abrir relatório", "Guarde este link privado. Qualquer pessoa com o link pode acessar o relatório.", "Você recebeu este e-mail porque comprou um relatório ou solicitou seu link de acesso no 12Axes.", "Ajuda ou reembolso"],
  es: ["Tu informe 12Axes", "Tu informe está listo", "Abrir informe", "Guarda este enlace privado. Cualquiera con el enlace puede ver el informe.", "Recibes este correo porque compraste un informe o solicitaste su enlace de acceso en 12Axes.", "Ayuda o reembolsos"],
  ru: ["Ваш отчёт 12Axes", "Ваш отчёт готов", "Открыть отчёт", "Сохраните приватную ссылку. Любой, у кого есть ссылка, может открыть отчёт.", "Вы получили это письмо, потому что купили отчёт или запросили ссылку доступа на 12Axes.", "Помощь или возврат"],
  zh: ["你的 12Axes 报告", "报告已就绪", "打开报告", "请保管此私人链接。持有链接的人可以查看报告。", "你收到此邮件，是因为在 12Axes 购买了报告或申请找回报告链接。", "帮助或退款"],
};

const worker = {
  async queue(batch: MessageBatch<EmailJob>, env: EmailEnv) {
    for (const job of batch.messages) {
      try {
        const row = await env.DB.prepare("SELECT status, customer_email, token_payload, locale, email_sent_at, recovery_sent_at, delivery_base_url, parent_order_id FROM orders WHERE id = ?")
          .bind(job.body.orderId).first<{ delivery_base_url: string; parent_order_id: string | null; status: string; customer_email: string; token_payload: string; locale: keyof typeof message; email_sent_at: number | null; recovery_sent_at: number | null }>();
        const recovery = job.body.deliveryId.startsWith("recover/");
        const now = Math.floor(Date.now() / 1000);
        if (!row || row.status !== "paid" || (!recovery && row.email_sent_at) || (recovery && row.recovery_sent_at && now - row.recovery_sent_at < 240)) { job.ack(); continue; }
        let reportTokenPayload = row.token_payload;
        if (row.parent_order_id) {
          const parent = await env.DB.prepare("SELECT status, token_payload FROM orders WHERE id = ?").bind(row.parent_order_id).first<{ status: string; token_payload: string }>();
          if (!parent || parent.status !== "paid") { job.ack(); continue; }
          reportTokenPayload = parent.token_payload;
        }
        if (!row.customer_email) throw new Error("Missing delivery address");
        const { token } = await decryptPayload<{ token: string }>(reportTokenPayload, env.REPORT_ENCRYPTION_KEY);
        const path = (row.locale === "en" ? "" : "/" + row.locale) + "/results?paid=1#report=" + token;
        const base = row.delivery_base_url;
        const url = base + path;
        const [subject, ready, open, keep, reason, help] = message[row.locale];
        const contactUrl = base + (row.locale === "en" ? "" : "/" + row.locale) + "/contact";
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json", "idempotency-key": job.body.deliveryId },
          body: JSON.stringify({ from: env.REPORT_FROM_EMAIL, to: row.customer_email, subject,
            text: ready + "\n\n" + reason + "\n\n" + url + "\n\n" + keep + "\n\n" + help + ": " + contactUrl,
            html: `<h1>12Axes</h1><p>${ready}</p><p>${reason}</p><p><a href="${url}">${open}</a></p><p>${keep}</p><p><a href="${contactUrl}">${help}</a></p>`,
          }), signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Email provider rejected delivery");
        await env.DB.prepare(recovery ? "UPDATE orders SET recovery_sent_at = ? WHERE id = ?" : "UPDATE orders SET email_sent_at = ? WHERE id = ?").bind(now, job.body.orderId).run();
        job.ack();
      } catch {
        job.retry({ delaySeconds: 60 });
      }
    }
  },
  async scheduled(_event: ScheduledController, env: EmailEnv) {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM shared_results WHERE expires_at <= ?").bind(now),
      env.DB.prepare("DELETE FROM orders WHERE status IN ('pending','failed') AND created_at < ?").bind(now - 7 * 86400),
      env.DB.prepare("DELETE FROM recovery_requests WHERE requested_at < ?").bind(now - 86400),
    ]);
  },
};

export default worker;
