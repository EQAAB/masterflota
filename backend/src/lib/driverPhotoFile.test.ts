import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  getDriverPhotosRoot,
  photoContentType,
  resolveDriverPhotoAbsolutePath,
} from "./driverPhotoFile";

describe("resolveDriverPhotoAbsolutePath", () => {
  it("returns null for empty path", () => {
    expect(resolveDriverPhotoAbsolutePath(null)).toBeNull();
    expect(resolveDriverPhotoAbsolutePath("")).toBeNull();
  });

  it("returns null for path traversal outside driver-photos", () => {
    expect(resolveDriverPhotoAbsolutePath("uploads/driver-documents/secret.pdf")).toBeNull();
    expect(resolveDriverPhotoAbsolutePath("../../etc/passwd")).toBeNull();
  });

  it("returns absolute path when file exists under driver-photos", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fm-photo-"));
    const prevCwd = process.cwd();
    process.chdir(tmpRoot);

    const driverId = "11111111-1111-4111-8111-111111111111";
    const rel = path.join("uploads", "driver-photos", driverId, "profile.jpg");
    fs.mkdirSync(path.dirname(rel), { recursive: true });
    fs.writeFileSync(rel, "fake-image");

    try {
      const resolved = resolveDriverPhotoAbsolutePath(rel.replace(/\\/g, "/"));
      expect(resolved).toBe(path.resolve(tmpRoot, rel));
    } finally {
      process.chdir(prevCwd);
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it("returns null when file is missing", () => {
    expect(
      resolveDriverPhotoAbsolutePath("uploads/driver-photos/missing-id/profile.jpg"),
    ).toBeNull();
  });
});

describe("photoContentType", () => {
  it("maps extensions to image mime types", () => {
    expect(photoContentType("profile.png")).toBe("image/png");
    expect(photoContentType("profile.jpg")).toBe("image/jpeg");
    expect(photoContentType("profile.jpeg")).toBe("image/jpeg");
  });
});

describe("getDriverPhotosRoot", () => {
  it("points under cwd uploads/driver-photos", () => {
    expect(getDriverPhotosRoot()).toBe(path.join(process.cwd(), "uploads", "driver-photos"));
  });
});
