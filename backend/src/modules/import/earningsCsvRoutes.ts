import { Router } from "express";
import { authenticateJWT, requirePermission } from "../../middleware/auth";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";
import { pool } from "../../db/pool";
import { readOrgGlovoCommissionBase } from "../earnings/orgImportSettings";
import { earningsUpload, entityCsvUpload } from "../../config/multer";
import { parseEarningsFile } from "../earnings/parseFile";
import {
  buildEarningsColumnMap,
  isBoltWeeklyColumnMap,
  isUberWeeklyColumnMap,
} from "../earnings/earningsColumnMap";
import { rowCellsToNormalized, filterEmptyNormalizedEarningsRows } from "../earnings/normalizeRow";
import { detectPlatformWithMeta, isEarningsPlatform, type EarningsPlatform } from "../earnings/detectPlatform";
import { extractDateFromFilename } from "../earnings/filenameDate";
import { prepareWeeklyImportRows } from "../earnings/findDuplicatePlatformIdsInFile";
import { insertEarningsPreviewStaging } from "../earnings/earningsPreviewStage";
import { runEarningsCommitFromStaging } from "../earnings/earningsCommit";
import { parseAndFilterEntityCsv } from "../../lib/parseEntityCsv";
import { importDriversFromCsvTable } from "./driverCsvImport";
import { importVehiclesFromCsvTable } from "./vehicleCsvImport";
const router = Router();

router.use(authenticateJWT);
router.use(attachOrgContext);
router.use(requirePermission("imports.create"));

/** One-shot: stage + commit in one request (same logic as preview + commit). */
router.post("/earnings-csv", earningsUpload.single("file"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = req.user?.sub;
  if (!orgId || !userId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  if (!req.file?.buffer) {
    return res.status(400).json({ message: "file is required" });
  }

  const platformRaw = req.body?.platform;
  const weekStart = req.body?.weekStart;
  const weekEnd = req.body?.weekEnd;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (!platformRaw || typeof platformRaw !== "string" || !isEarningsPlatform(platformRaw.trim())) {
    return res.status(400).json({ message: "platform is required and must be a valid earnings provider" });
  }
  if (typeof weekStart !== "string" || typeof weekEnd !== "string" || !isoDate.test(weekStart) || !isoDate.test(weekEnd)) {
    return res.status(400).json({ message: "weekStart and weekEnd are required (YYYY-MM-DD)" });
  }
  if (weekStart > weekEnd) {
    return res.status(400).json({ message: "weekStart must be on or before weekEnd" });
  }

  const platformEff = platformRaw.trim() as EarningsPlatform;

  try {
    const table = await parseEarningsFile(req.file.buffer, req.file.originalname);
    if (!table.headers.length || !table.rows.length) {
      return res.status(400).json({ message: "No data rows found in file" });
    }

    const { confidence: detectionConfidence } = detectPlatformWithMeta(req.file.originalname, table.headers);
    const boltWeekly = isBoltWeeklyColumnMap(table.headers);
    const uberTaxi = isUberWeeklyColumnMap(table.headers);
    const colMap = buildEarningsColumnMap(table.headers);
    const filenameDate = extractDateFromFilename(req.file.originalname);
    const mappedRows = table.rows.map((cells) =>
      rowCellsToNormalized(cells, colMap, filenameDate, {
        skipInferredPlatformFee: platformEff === "glovo" || uberTaxi,
        boltWeeklyExport: boltWeekly,
        uberTaxiExport: uberTaxi,
      }),
    );
    const { rows: filteredRows, emptyRowsSkipped: normalizedEmptySkipped } =
      filterEmptyNormalizedEarningsRows(mappedRows);
    const parseStats = {
      ...table.parseStats,
      emptyRowsSkipped: table.parseStats.emptyRowsSkipped + normalizedEmptySkipped,
      dataRowsParsed: filteredRows.length,
    };

    if (!filteredRows.length) {
      return res.status(400).json({ message: "No data rows found in file" });
    }

    const { rows: normalizedRows } = prepareWeeklyImportRows(filteredRows);
    if (normalizedRows.length !== filteredRows.length) {
      parseStats.dataRowsParsed = normalizedRows.length;
    }

    const glovoCommissionBaseType =
      platformEff === "glovo" ? await readOrgGlovoCommissionBase(orgId) : undefined;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const importId = await insertEarningsPreviewStaging(client, {
        orgId,
        userId,
        fileName: req.file.originalname,
        weekStart,
        weekEnd,
        platform: platformEff,
        detectionConfidence,
        filenameDate,
        headerCount: table.headers.length,
        rowCount: table.rows.length,
        normalizedRows,
        glovoCommissionBaseType,
        boltWeeklyExport: boltWeekly,
        uberTaxiExport: uberTaxi,
        parseStats,
      });
      const commitResult = await runEarningsCommitFromStaging(client, orgId, importId, platformEff, weekStart, weekEnd);
      await client.query("COMMIT");
      return res.json({
        importId,
        ...commitResult,
      });
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Import failed";
    // eslint-disable-next-line no-console
    console.error("One-shot earnings CSV error", err);
    return res.status(400).json({ message: msg });
  }
});

router.post("/drivers-csv", entityCsvUpload.single("file"), async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  if (!req.file?.buffer) {
    return res.status(400).json({ message: "file is required" });
  }

  try {
    const { table, stats } = parseAndFilterEntityCsv(req.file.buffer);
    if (!table.headers.length) {
      return res.status(400).json({ message: "CSV file has no header row" });
    }
    if (!table.rows.length) {
      return res.status(400).json({ message: "No data rows found in file" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const summary = await importDriversFromCsvTable(client, orgId, table, stats);
      await client.query("COMMIT");
      return res.json(summary);
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Import failed";
    // eslint-disable-next-line no-console
    console.error("Driver CSV import error", err);
    return res.status(400).json({ message: msg });
  }
});

router.post("/vehicles-csv", entityCsvUpload.single("file"), async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  if (!req.file?.buffer) {
    return res.status(400).json({ message: "file is required" });
  }

  try {
    const { table, stats } = parseAndFilterEntityCsv(req.file.buffer);
    if (!table.headers.length) {
      return res.status(400).json({ message: "CSV file has no header row" });
    }
    if (!table.rows.length) {
      return res.status(400).json({ message: "No data rows found in file" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const summary = await importVehiclesFromCsvTable(client, orgId, table, stats);
      await client.query("COMMIT");
      return res.json(summary);
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Import failed";
    // eslint-disable-next-line no-console
    console.error("Vehicle CSV import error", err);
    return res.status(400).json({ message: msg });
  }
});

export const importEarningsCsvRoutes = router;
