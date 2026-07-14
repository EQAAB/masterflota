import type { Request, Response } from "express";
import { requireOrgId } from "../../middleware/orgContext";
import { query } from "../../db/pool";
import {
  listAssignmentHistoryByDriver,
  listAssignmentHistoryByVehicle,
  listRecentAssignments,
  parseAssignmentHistoryFilters,
} from "./vehicleAssignmentHistoryQueries";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleDriverVehicleHistory(req: Request, res: Response): Promise<void> {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const driverId = String(req.params.id);

  if (!UUID_RE.test(driverId)) {
    res.status(400).json({ message: "Invalid driver id" });
    return;
  }

  try {
    const { rows: driverCheck } = await query<{ id: string }>(
      `SELECT id::text FROM drivers
       WHERE id = $1::uuid AND organization_id = $2::uuid AND (is_deleted = false OR is_deleted IS NULL)`,
      [driverId, orgId],
    );
    if (!driverCheck[0]) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    const filters = parseAssignmentHistoryFilters(req);
    const items = await listAssignmentHistoryByDriver(orgId, driverId, filters);
    res.json({ items });
  } catch (err) {
    console.error("Driver vehicle history error", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleVehicleDriverHistory(req: Request, res: Response): Promise<void> {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const vehicleId = String(req.params.id);

  if (!UUID_RE.test(vehicleId)) {
    res.status(400).json({ message: "Invalid vehicle id" });
    return;
  }

  try {
    const { rows: vehicleCheck } = await query<{ id: string }>(
      `SELECT id::text FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [vehicleId, orgId],
    );
    if (!vehicleCheck[0]) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const filters = parseAssignmentHistoryFilters(req);
    const items = await listAssignmentHistoryByVehicle(orgId, vehicleId, filters);
    res.json({ items });
  } catch (err) {
    console.error("Vehicle driver history error", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDateParam(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = ISO_DATE_RE.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(y, month - 1, day));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export async function handleRecentAssignments(req: Request, res: Response): Promise<void> {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const limitRaw = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 5;
  const limit = Number.isFinite(limitRaw) ? limitRaw : 5;

  const from = parseIsoDateParam(req.query.from);
  const to = parseIsoDateParam(req.query.to);
  if ((from && !to) || (!from && to)) {
    res.status(400).json({ message: "Provide both from and to (YYYY-MM-DD), or neither" });
    return;
  }
  if (from && to && from > to) {
    res.status(400).json({ message: "from must be on or before to" });
    return;
  }
  const period = from && to ? { from, to } : undefined;

  try {
    const items = await listRecentAssignments(orgId, limit, period);
    res.json({ items });
  } catch (err) {
    console.error("Recent assignments error", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
