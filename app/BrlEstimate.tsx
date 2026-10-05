"use client";

import { useEffect, useState } from "react";

export function BrlEstimate({ amount = 4.99 }: { amount?: number }) {
  const [estimate, setEstimate] = useState<{ brl: number; date: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pricing", { signal: controller.signal }).then(async (response) => {
      if (response.ok) setEstimate(await response.json());
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!estimate) return null;
  return <p className="billing-note">Aproximadamente {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(estimate.brl * amount / 4.99)}. <a href="https://frankfurter.dev/">Câmbio de referência</a>: {estimate.date.split("-").reverse().join("/")}. Cobrança de US$ {amount.toFixed(2).replace(".", ",")}; o câmbio do banco, IOF e outras taxas podem alterar o valor final.</p>;
}
