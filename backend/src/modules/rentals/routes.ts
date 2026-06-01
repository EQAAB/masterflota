import { Router } from "express";
import { authenticateJWT, requireRole } from "../../middleware/auth";
import { query } from "../../db/pool";
import { rentalDb } from "./rentalDb";
import { customersRoutes } from "./customersRoutes";
import { bookingsRoutes } from "./bookingsRoutes";
import { availabilityRoutes } from "./availabilityRoutes";
import { pricingRoutes } from "./pricingRoutes";
import { paymentsRoutes } from "./paymentsRoutes";
import { reportsRoutes } from "./reportsRoutes";
import { buildContractText } from "./contractPdf";

const router = Router();

router.use(authenticateJWT);
router.use(requireRole("admin", "accountant"));

router.use("/customers", customersRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/availability", availabilityRoutes);
router.use("/pricing", pricingRoutes);
router.use("/payments", paymentsRoutes);
router.use("/reports", reportsRoutes);

router.get("/dashboard", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const { rows: stats } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'active') AS active_bookings,
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'confirmed') AS confirmed_bookings,
         (SELECT COUNT(*)::int FROM rental_customers WHERE organization_id = $1 AND is_active = true) AS active_customers,
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'active' AND end_at < NOW()) AS overdue_bookings`,
      [orgId],
    );
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const { rows: rev } = await query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS mtd_revenue
       FROM rental_payments
       WHERE organization_id = $1 AND payment_type = 'rent' AND status = 'paid'
         AND paid_at >= $2::timestamptz`,
      [orgId, monthStart],
    );
    return res.json({ ...stats[0], mtd_revenue: rev[0]?.mtd_revenue ?? 0 });
  } catch (err) {
    console.error("Rental dashboard error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/bookings/:id/contract", async (req, res) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const text = await buildContractText(rentalDb, orgId, id);
    if (!text) return res.status(404).json({ message: "Booking not found" });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="contract-${id}.txt"`);
    return res.send(text);
  } catch (err) {
    console.error("Contract export error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const rentalRoutes = router;
