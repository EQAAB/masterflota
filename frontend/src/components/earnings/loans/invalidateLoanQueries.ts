import type { QueryClient } from "@tanstack/react-query";

export function invalidateLoanQueries(qc: QueryClient, opts?: { driverId?: string; loanId?: string }) {
  if (opts?.driverId) {
    void qc.invalidateQueries({ queryKey: ["driver-loans", opts.driverId] });
    void qc.invalidateQueries({ queryKey: ["driver-loan-active", opts.driverId] });
  }
  if (opts?.loanId) {
    void qc.invalidateQueries({ queryKey: ["loan", opts.loanId] });
  }
  void qc.invalidateQueries({ queryKey: ["drivers", "loans", "summary"] });
  void qc.invalidateQueries({ queryKey: ["drivers", "loans", "list"] });
  void qc.invalidateQueries({ queryKey: ["earnings"] });
}
