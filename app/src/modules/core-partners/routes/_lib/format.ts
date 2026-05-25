


// ======================== app/partners/_lib/format.ts ==========================
export function formatAmount(centsOrDollars: number) {
    const n = centsOrDollars;
    // Treat numbers >= 100000 as dollars already; adjust if you store cents instead
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  }
  
  export function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }
  