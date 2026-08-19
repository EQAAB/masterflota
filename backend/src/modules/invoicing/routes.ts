import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth";
import { attachOrgContext } from "../../middleware/orgContext";
import { fiscalProfileRoutes } from "./fiscalProfileRoutes";
import { seriesRoutes } from "./seriesRoutes";
import { invoiceRoutes } from "./invoiceRoutes";
import { anafRoutes } from "./anafRoutes";
import { certificateRoutes } from "./certificateRoutes";
import { providerRoutes } from "./providerRoutes";

const router = Router();

// ANAF callback is unauthenticated (redirect from ANAF)
router.get("/anaf/callback", anafRoutes);

router.use(authenticateJWT);
router.use(attachOrgContext);

router.use("/fiscal-profile", fiscalProfileRoutes);
router.use("/series", seriesRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/anaf", anafRoutes);
router.use("/certificate", certificateRoutes);
router.use("/provider", providerRoutes);

export const invoicingRoutes = router;
