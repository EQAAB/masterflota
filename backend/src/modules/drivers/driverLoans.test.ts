import { describe, expect, it } from "vitest";
import { resolveRepaymentStatus } from "./driverLoans";

describe("resolveRepaymentStatus", () => {
  it("keeps active when balance remains", () => {
    expect(resolveRepaymentStatus("cash", 100, false)).toBe("active");
    expect(resolveRepaymentStatus("from_payout", 50, false)).toBe("active");
  });

  it("marks paid when balance zeroed by cash or payout", () => {
    expect(resolveRepaymentStatus("cash", 0, false)).toBe("paid");
    expect(resolveRepaymentStatus("from_payout", 0, false)).toBe("paid");
  });

  it("marks written_off on full forgive", () => {
    expect(resolveRepaymentStatus("forgive", 0, true)).toBe("written_off");
    expect(resolveRepaymentStatus("forgive", 0, false)).toBe("paid");
  });
});
