import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  hashSessionToken,
  validateActiveSession,
  revokeAllUserSessions,
  revokeUserSession,
} from "./userSession";

const queryMock = vi.fn();

vi.mock("../db/pool", () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

describe("hashSessionToken", () => {
  it("returns stable sha256 hex", () => {
    const a = hashSessionToken("test-jti");
    const b = hashSessionToken("test-jti");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("validateActiveSession", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns true when session row exists", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ ok: 1 }] });
    await expect(validateActiveSession("user-1", "jti-1")).resolves.toBe(true);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("user_sessions"),
      ["user-1", hashSessionToken("jti-1")],
    );
  });

  it("returns false when session row is missing", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(validateActiveSession("user-1", "jti-1")).resolves.toBe(false);
  });
});

describe("revokeAllUserSessions", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("deletes all sessions for user", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await revokeAllUserSessions("user-1");
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM user_sessions"),
      ["user-1"],
    );
  });
});

describe("revokeUserSession", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("deletes session matching hashed jti", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await revokeUserSession("user-1", "jti-abc");
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM user_sessions"),
      ["user-1", hashSessionToken("jti-abc")],
    );
  });
});
