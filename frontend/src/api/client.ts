import type { AnalyticsSummary, CustomerDetail, LeadSummary, LoanType } from "../types";

// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.ts).
// In production, set VITE_API_BASE_URL to the deployed FastAPI origin.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getLeads: (params?: {
    loanType?: LoanType;
    minScore?: number;
    surfacedOnly?: boolean;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.loanType) q.set("loan_type", params.loanType);
    if (params?.minScore !== undefined) q.set("min_score", String(params.minScore));
    if (params?.surfacedOnly !== undefined)
      q.set("surfaced_only", String(params.surfacedOnly));
    if (params?.limit !== undefined) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<LeadSummary[]>(`/api/leads${qs ? `?${qs}` : ""}`);
  },

  getLeadDetail: (customerId: string) =>
    request<CustomerDetail>(`/api/leads/${customerId}`),

  getAnalyticsSummary: () => request<AnalyticsSummary>("/api/analytics/summary"),
};
