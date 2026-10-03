"use client";

import { useEffect, useState } from "react";

export function BrlEstimate() {
  const [estimate, setEstimate] = useState<{ brl: number; date: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pricing", { signal: controller.signal }).then(async (response) => {
      if (response.ok) setEstimate(await response.json());
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!estimate) return null;
  return <p className="billing-note">Aproximadamente {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(estimate.brl)}. <a href="https://frankfurter.dev/">Câmbio de referência</a>: {estimate.date.split("-").reverse().join("/")}. Cobrança de US$ 4,99; o câmbio do banco, IOF e outras taxas podem alterar o valor final.</p>;
}
