import { describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "http";

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

import { app } from "./app";

function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const server: Server = createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      run(`http://127.0.0.1:${port}`)
        .then(() => {
          server.close((err) => (err ? reject(err) : resolve()));
        })
        .catch((err) => {
          server.close(() => reject(err));
        });
    });
    server.on("error", reject);
  });
}

describe("uploads static serving removed", () => {
  it("GET /uploads/* returns 404", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/uploads/driver-photos/test/profile.jpg`);
      expect(res.status).toBe(404);
    });
  });
});

describe("driver photo route auth", () => {
  it("GET /api/drivers/:id/photo without token returns 401", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(
        `${baseUrl}/api/drivers/11111111-1111-4111-8111-111111111111/photo`,
      );
      expect(res.status).toBe(401);
    });
  });
});
