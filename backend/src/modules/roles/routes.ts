import { Router } from "express";
import { pool, query } from "../../db/pool";
import { writeAuditLog } from "../../lib/auditLog";
import { authenticateJWT, requirePermission } from "../../middleware/auth";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";

const router = Router();

router.use(authenticateJWT);
router.use(attachOrgContext);

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_default: boolean;
};

function serializeRole(r: RoleRow, permissions: string[]) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    isSystemRole: r.is_system_role,
    isDefault: r.is_default,
    permissions: permissions.sort(),
  };
}

router.get("/", requirePermission("roles.manage", "users.manage"), async (_req, res) => {
  try {
    const { rows: roles } = await query<RoleRow>(
      `SELECT id::text, name, description, is_system_role, is_default
       FROM roles ORDER BY name`,
    );
    const { rows: perms } = await query<{ role_id: string; permission_name: string }>(
      `SELECT rp.role_id::text, p.name AS permission_name
       FROM role_permissions rp
       INNER JOIN permissions p ON p.id = rp.permission_id`,
    );
    const byRole = new Map<string, string[]>();
    for (const row of perms) {
      const list = byRole.get(row.role_id) ?? [];
      list.push(row.permission_name);
      byRole.set(row.role_id, list);
    }
    return res.json(roles.map((r) => serializeRole(r, byRole.get(r.id) ?? [])));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List roles error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/permissions", requirePermission("roles.manage", "users.manage"), async (_req, res) => {
  try {
    const { rows } = await query<{ id: string; name: string; module: string; description: string | null }>(
      `SELECT id::text, name, module, description FROM permissions ORDER BY module, name`,
    );
    return res.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List permissions error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requirePermission("roles.manage"), async (req, res) => {
  const { name, description, permissionNames } = req.body as {
    name?: string;
    description?: string;
    permissionNames?: string[];
  };
  if (!name?.trim()) {
    return res.status(400).json({ message: "name is required" });
  }
  const slug = name.trim().toLowerCase().replace(/\s+/g, "_");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT id FROM roles WHERE name = $1`, [slug]);
    if (existing.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "A role with this name already exists" });
    }
    const roleRes = await client.query<RoleRow>(
      `INSERT INTO roles (name, description, is_system_role, is_default)
       VALUES ($1, $2, false, false)
       RETURNING id::text, name, description, is_system_role, is_default`,
      [slug, description?.trim() ?? null],
    );
    const role = roleRes.rows[0];
    const perms: string[] = [];
    if (Array.isArray(permissionNames) && permissionNames.length > 0) {
      const permRes = await client.query<{ id: string; name: string }>(
        `SELECT id::text, name FROM permissions WHERE name = ANY($1::text[])`,
        [permissionNames],
      );
      if (permRes.rows.length !== permissionNames.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "One or more permissions are invalid" });
      }
      for (const p of permRes.rows) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1::uuid, $2::uuid)`,
          [role.id, p.id],
        );
        perms.push(p.name);
      }
    }
    await client.query("COMMIT");

    await writeAuditLog({
      orgId: req.effectiveOrgId ?? null,
      userId: req.user?.sub ?? null,
      action: "role.created",
      entityType: "role",
      entityId: role.id,
      newValue: { name: role.name, description: role.description, permissions: perms },
      req,
    });

    return res.status(201).json(serializeRole(role, perms));
  } catch (err) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Create role error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

router.get("/:id", requirePermission("roles.manage"), async (req, res) => {
  try {
    const { rows } = await query<RoleRow>(
      `SELECT id::text, name, description, is_system_role, is_default FROM roles WHERE id = $1::uuid`,
      [req.params.id],
    );
    const role = rows[0];
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    const { rows: perms } = await query<{ name: string }>(
      `SELECT p.name FROM role_permissions rp
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1::uuid ORDER BY p.name`,
      [req.params.id],
    );
    return res.json(serializeRole(role, perms.map((p) => p.name)));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Get role error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", requirePermission("roles.manage"), async (req, res) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (name === undefined && description === undefined) {
    return res.status(400).json({ message: "No fields to update" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const roleRes = await client.query<RoleRow>(
      `SELECT id::text, name, description, is_system_role, is_default FROM roles WHERE id = $1::uuid FOR UPDATE`,
      [req.params.id],
    );
    const role = roleRes.rows[0];
    if (!role) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Role not found" });
    }
    if (role.is_system_role) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "System roles cannot be modified" });
    }
    const newName = name !== undefined ? name.trim().toLowerCase().replace(/\s+/g, "_") : role.name;
    if (newName !== role.name) {
      const dup = await client.query(`SELECT id FROM roles WHERE name = $1 AND id <> $2::uuid`, [
        newName,
        req.params.id,
      ]);
      if (dup.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "A role with this name already exists" });
      }
    }
    const updated = await client.query<RoleRow>(
      `UPDATE roles SET
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING id::text, name, description, is_system_role, is_default`,
      [req.params.id, name !== undefined ? newName : null, description !== undefined ? description.trim() : null],
    );
    await client.query("COMMIT");

    const after = updated.rows[0];
    await writeAuditLog({
      orgId: req.effectiveOrgId ?? null,
      userId: req.user?.sub ?? null,
      action: "role.updated",
      entityType: "role",
      entityId: role.id,
      oldValue: role,
      newValue: after,
      req,
    });

    const { rows: perms } = await query<{ name: string }>(
      `SELECT p.name FROM role_permissions rp
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1::uuid`,
      [req.params.id],
    );
    return res.json(serializeRole(after, perms.map((p) => p.name)));
  } catch (err) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Update role error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

router.delete("/:id", requirePermission("roles.manage"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const roleRes = await client.query<RoleRow>(
      `SELECT id::text, name, description, is_system_role, is_default FROM roles WHERE id = $1::uuid FOR UPDATE`,
      [req.params.id],
    );
    const role = roleRes.rows[0];
    if (!role) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Role not found" });
    }
    if (role.is_system_role) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "System roles cannot be deleted" });
    }
    const usersRes = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users WHERE role_id = $1::uuid`,
      [req.params.id],
    );
    if (Number(usersRes.rows[0]?.count ?? 0) > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Cannot delete role assigned to users" });
    }
    await client.query(`DELETE FROM roles WHERE id = $1::uuid`, [req.params.id]);
    await client.query("COMMIT");

    await writeAuditLog({
      orgId: req.effectiveOrgId ?? null,
      userId: req.user?.sub ?? null,
      action: "role.deleted",
      entityType: "role",
      entityId: role.id,
      oldValue: role,
      req,
    });

    return res.status(204).send();
  } catch (err) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Delete role error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

router.patch("/:id/permissions", requirePermission("roles.manage"), async (req, res) => {
  const { permissionNames } = req.body as { permissionNames?: string[] };
  if (!Array.isArray(permissionNames)) {
    return res.status(400).json({ message: "permissionNames array is required" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const roleRes = await client.query<RoleRow>(
      `SELECT id::text, name, description, is_system_role, is_default FROM roles WHERE id = $1::uuid FOR UPDATE`,
      [req.params.id],
    );
    const role = roleRes.rows[0];
    if (!role) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Role not found" });
    }
    if (role.is_system_role) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "System roles cannot be modified" });
    }
    const oldPermsRes = await client.query<{ name: string }>(
      `SELECT p.name FROM role_permissions rp
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1::uuid`,
      [req.params.id],
    );
    const oldPerms = oldPermsRes.rows.map((p) => p.name).sort();

    const permRes = await client.query<{ id: string; name: string }>(
      `SELECT id::text, name FROM permissions WHERE name = ANY($1::text[])`,
      [permissionNames],
    );
    if (permRes.rows.length !== permissionNames.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "One or more permissions are invalid" });
    }
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1::uuid`, [req.params.id]);
    for (const p of permRes.rows) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1::uuid, $2::uuid)`,
        [req.params.id, p.id],
      );
    }
    await client.query("COMMIT");

    const newPerms = permRes.rows.map((p) => p.name).sort();
    await writeAuditLog({
      orgId: req.effectiveOrgId ?? null,
      userId: req.user?.sub ?? null,
      action: "role.permissions_updated",
      entityType: "role",
      entityId: role.id,
      oldValue: { permissions: oldPerms },
      newValue: { permissions: newPerms },
      req,
    });

    return res.json({ ok: true, permissions: newPerms });
  } catch (err) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Update role permissions error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

export const roleRoutes = router;
