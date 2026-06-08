import fs from "fs";
import path from "path";

const DRIVER_PHOTOS_DIR = "uploads/driver-photos";

export function getDriverPhotosRoot(): string {
  return path.join(process.cwd(), DRIVER_PHOTOS_DIR);
}

export function resolveDriverPhotoAbsolutePath(relativePath: string | null | undefined): string | null {
  if (!relativePath?.trim()) return null;

  const normalized = relativePath.replace(/\\/g, "/");
  const absolute = path.resolve(process.cwd(), normalized);
  const rootResolved = path.resolve(getDriverPhotosRoot());
  const withinRoot =
    absolute === rootResolved || absolute.startsWith(`${rootResolved}${path.sep}`);
  if (!withinRoot) return null;
  if (!fs.existsSync(absolute)) return null;
  return absolute;
}

export function photoContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  return "image/jpeg";
}
