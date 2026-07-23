import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRoutes } from "./modules/auth/routes";
import { driverRoutes } from "./modules/drivers/routes";
import { documentRoutes } from "./modules/documents/routes";
import { dashboardRoutes } from "./modules/dashboard/routes";
import { vehicleRoutes } from "./modules/vehicles/routes";
import { vehicleDocumentRoutes } from "./modules/vehicleDocuments/routes";
import { earningsRoutes } from "./modules/earnings/routes";
import { importEarningsCsvRoutes } from "./modules/import/earningsCsvRoutes";
import { subcontractorRoutes } from "./modules/subcontractors/routes";
import { subcontractorPayoutRoutes } from "./modules/subcontractorPayouts/routes";
import { rentalRoutes } from "./modules/rentals/routes";
import { userRoutes } from "./modules/users/routes";
import { roleRoutes } from "./modules/roles/routes";
import { settingsRoutes } from "./modules/settings/routes";
import { auditRoutes } from "./modules/audit/routes";
import { loginEventRoutes } from "./modules/loginEvents/routes";
import { organizationRoutes } from "./modules/organizations/routes";

export const app = express();

app.use(cors({
  origin: env.corsOrigins,
  allowedHeaders: ["Content-Type", "Authorization", "X-Organization-Id"],
  exposedHeaders: ["Content-Type", "X-App-Version"],
}));
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("X-App-Version", env.appVersion);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/drivers", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/earnings", earningsRoutes);
app.use("/api/import", importEarningsCsvRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/vehicles", vehicleDocumentRoutes);
app.use("/api/subcontractors", subcontractorRoutes);
app.use("/api/subcontractor-payouts", subcontractorPayoutRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/login-events", loginEventRoutes);
app.use("/api/organizations", organizationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: env.appVersion });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Multer / upload errors
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const m = err as { code?: string; message?: string };
  if (m.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "File too large. Driver documents: 10MB max. Earnings uploads: 40MB max.",
    });
  }
  if (m.message && typeof m.message === "string") {
    if (
      m.message.includes("Only PDF") ||
      m.message.includes("Profile photo") ||
      m.message.includes("JPG or PNG") ||
      m.message.includes("Earnings upload:")
    ) {
      return res.status(400).json({ message: m.message });
    }
  }
  return res.status(500).json({ message: "Internal server error" });
});

