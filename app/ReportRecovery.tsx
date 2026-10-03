"use client";
import { useState } from "react";
import type { Locale } from "./i18n";
import { reportUi } from "./report-copy";

export function ReportRecovery({ locale }: { locale: Locale }) {
  const text = reportUi[locale];
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <section className="report-recovery">
    <h2>{text.recover}</h2>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      setBusy(true);
      setMessage("");
      try {
        const response = await fetch("/api/report/recover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
        if (!response.ok) throw new Error();
        setMessage(text.sent);
      } catch { setMessage(text.failed); }
      finally { setBusy(false); }
    }}>
      <label>{text.email}<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <button className="secondary-button" disabled={busy}>{busy ? "…" : text.send}</button>
    </form>
    <p role="status">{message}</p>
  </section>;
}
