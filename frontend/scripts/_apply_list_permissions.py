from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "components"


def patch(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    if old not in text:
        if new.split("\n", 1)[0] in text:
            print(f"skip {label} (already applied)")
            return
        raise SystemExit(f"patch failed for {label}: anchor not found in {path}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"patched {label}")


# --- DriversList ---
drivers_list = ROOT / "drivers" / "DriversList.tsx"
patch(
    drivers_list,
    'import { exportDriversCsv } from "../../utils/exportDriversCsv";',
    'import { usePermission } from "../../lib/permissions";\nimport { exportDriversCsv } from "../../utils/exportDriversCsv";',
    "DriversList import",
)
patch(
    drivers_list,
    "  const queryClient = useQueryClient();",
    "  const queryClient = useQueryClient();\n  const canCreate = usePermission(\"drivers.create\");\n  const canEdit = usePermission(\"drivers.edit\");\n  const canImport = usePermission(\"imports.create\");",
    "DriversList hooks",
)
patch(
    drivers_list,
    "    return buildDriverActionMenuItems({\n      canSuspend,",
    "    return buildDriverActionMenuItems({\n      canEdit,\n      canSuspend,",
    "DriversList menu canEdit",
)
patch(
    drivers_list,
    "  }, [openMenuDriver, closeActionMenu, navigate]);",
    "  }, [openMenuDriver, closeActionMenu, navigate, canEdit]);",
    "DriversList menu deps",
)
patch(
    drivers_list,
    """      <DriversPageHeader
        onExport={() => exportDriversCsv(filteredDrivers)}
        onImport={() => importInputRef.current?.click()}
        importBusy={importMutation.isPending}
        exportDisabled={filteredDrivers.length === 0}
      />""",
    """      <DriversPageHeader
        onExport={() => exportDriversCsv(filteredDrivers)}
        onImport={() => importInputRef.current?.click()}
        importBusy={importMutation.isPending}
        exportDisabled={filteredDrivers.length === 0}
        canCreate={canCreate}
        canImport={canImport}
      />""",
    "DriversList header props",
)
patch(
    drivers_list,
    "            onActionMenuToggle={handleActionMenuToggle}\n            embedded",
    "            onActionMenuToggle={handleActionMenuToggle}\n            canCreate={canCreate}\n            embedded",
    "DriversList table canCreate",
)

# --- DriversTable ---
drivers_table = ROOT / "drivers" / "DriversTable.tsx"
patch(
    drivers_table,
    "  onActionMenuToggle: (driverId: string, event: React.MouseEvent<HTMLButtonElement>) => void;\n  embedded?: boolean;",
    "  onActionMenuToggle: (driverId: string, event: React.MouseEvent<HTMLButtonElement>) => void;\n  canCreate?: boolean;\n  embedded?: boolean;",
    "DriversTable type",
)
patch(
    drivers_table,
    "  onActionMenuToggle,\n  embedded = false,",
    "  onActionMenuToggle,\n  canCreate = false,\n  embedded = false,",
    "DriversTable destructure",
)
patch(
    drivers_table,
    '          action={{ label: "Add driver", to: "/drivers/new" }}',
    '          action={canCreate ? { label: "Add driver", to: "/drivers/new" } : undefined}',
    "DriversTable empty action",
)

# --- VehiclesList ---
vehicles_list = ROOT / "vehicles" / "VehiclesList.tsx"
patch(
    vehicles_list,
    "  const canDelete = usePermission(\"vehicles.delete\");",
    "  const canCreate = usePermission(\"vehicles.create\");\n  const canEdit = usePermission(\"vehicles.edit\");\n  const canAssign = usePermission(\"vehicles.assign\");\n  const canImport = usePermission(\"imports.create\");\n  const canDelete = usePermission(\"vehicles.delete\");",
    "VehiclesList hooks",
)
patch(
    vehicles_list,
    "    return buildVehicleActionMenuItems({\n      canDelete,",
    "    return buildVehicleActionMenuItems({\n      canEdit,\n      canAssign,\n      canDelete,",
    "VehiclesList menu",
)
patch(
    vehicles_list,
    "  }, [openMenuVehicle, closeActionMenu, navigate, canDelete, onDeleteRequest]);",
    "  }, [openMenuVehicle, closeActionMenu, navigate, canEdit, canAssign, canDelete, onDeleteRequest]);",
    "VehiclesList menu deps",
)
patch(
    vehicles_list,
    """      <VehiclesPageHeader
        onExport={handleExport}
        onImport={() => importInputRef.current?.click()}
        importBusy={importMutation.isPending}
        exportDisabled={rows.length === 0}
      />""",
    """      <VehiclesPageHeader
        onExport={handleExport}
        onImport={() => importInputRef.current?.click()}
        importBusy={importMutation.isPending}
        exportDisabled={rows.length === 0}
        canCreate={canCreate}
        canImport={canImport}
      />""",
    "VehiclesList header",
)
patch(
    vehicles_list,
    "            onActionMenuToggle={handleActionMenuToggle}\n            embedded",
    "            onActionMenuToggle={handleActionMenuToggle}\n            canCreate={canCreate}\n            embedded",
    "VehiclesList table",
)

# --- VehiclesTable ---
vehicles_table = ROOT / "vehicles" / "VehiclesTable.tsx"
patch(
    vehicles_table,
    "  onActionMenuToggle: (vehicleId: string, event: React.MouseEvent<HTMLButtonElement>) => void;\n  embedded?: boolean;",
    "  onActionMenuToggle: (vehicleId: string, event: React.MouseEvent<HTMLButtonElement>) => void;\n  canCreate?: boolean;\n  embedded?: boolean;",
    "VehiclesTable type",
)
patch(
    vehicles_table,
    "  onActionMenuToggle,\n  embedded = false,",
    "  onActionMenuToggle,\n  canCreate = false,\n  embedded = false,",
    "VehiclesTable destructure",
)
patch(
    vehicles_table,
    '          action={{ label: "Add Vehicle", to: "/vehicles/new" }}',
    '          action={canCreate ? { label: "Add Vehicle", to: "/vehicles/new" } : undefined}',
    "VehiclesTable empty",
)

# --- SubcontractorsList ---
subs_list = ROOT / "subcontractors" / "SubcontractorsList.tsx"
patch(
    subs_list,
    'import { exportSubcontractorsCsv } from "../../utils/exportSubcontractorsCsv";',
    'import { usePermission } from "../../lib/permissions";\nimport { exportSubcontractorsCsv } from "../../utils/exportSubcontractorsCsv";',
    "SubcontractorsList import",
)
patch(
    subs_list,
    "  const queryClient = useQueryClient();",
    "  const queryClient = useQueryClient();\n  const canCreate = usePermission(\"subcontractors.create\");\n  const canEdit = usePermission(\"subcontractors.edit\");",
    "SubcontractorsList hooks",
)
patch(
    subs_list,
    "    return buildSubcontractorActionMenuItems({\n      isActive,",
    "    return buildSubcontractorActionMenuItems({\n      canEdit,\n      isActive,",
    "SubcontractorsList menu",
)
patch(
    subs_list,
    "  }, [openMenuSubcontractor, closeActionMenu, navigate]);",
    "  }, [openMenuSubcontractor, closeActionMenu, navigate, canEdit]);",
    "SubcontractorsList menu deps",
)
patch(
    subs_list,
    "      <SubcontractorsPageHeader onExport={handleExport} exportDisabled={filteredSubcontractors.length === 0} />",
    "      <SubcontractorsPageHeader\n        onExport={handleExport}\n        exportDisabled={filteredSubcontractors.length === 0}\n        canCreate={canCreate}\n      />",
    "SubcontractorsList header",
)
patch(
    subs_list,
    "            onActionMenuToggle={handleActionMenuToggle}\n            embedded",
    "            onActionMenuToggle={handleActionMenuToggle}\n            canCreate={canCreate}\n            embedded",
    "SubcontractorsList table",
)

# --- SubcontractorsTable ---
subs_table = ROOT / "subcontractors" / "SubcontractorsTable.tsx"
patch(
    subs_table,
    "  onActionMenuToggle: (subcontractorId: string, event: React.MouseEvent<HTMLButtonElement>) => void;\n  embedded?: boolean;",
    "  onActionMenuToggle: (subcontractorId: string, event: React.MouseEvent<HTMLButtonElement>) => void;\n  canCreate?: boolean;\n  embedded?: boolean;",
    "SubcontractorsTable type",
)
patch(
    subs_table,
    "  onActionMenuToggle,\n  embedded = false,",
    "  onActionMenuToggle,\n  canCreate = false,\n  embedded = false,",
    "SubcontractorsTable destructure",
)
patch(
    subs_table,
    '          action={{ label: "Add subcontractor", to: "/subcontractors/new" }}',
    '          action={canCreate ? { label: "Add subcontractor", to: "/subcontractors/new" } : undefined}',
    "SubcontractorsTable empty",
)

# --- VehicleDocumentsPage ---
docs_page = ROOT.parent / "pages" / "vehicles" / "VehicleDocumentsPage.tsx"
patch(
    docs_page,
    'import { VehicleDocumentList } from "../../components/vehicles/VehicleDocumentList";',
    'import { usePermission } from "../../lib/permissions";\nimport { VehicleDocumentList } from "../../components/vehicles/VehicleDocumentList";',
    "VehicleDocumentsPage import",
)
patch(
    docs_page,
    "export function VehicleDocumentsPage() {\n  const { id } = useParams<{ id: string }>();",
    "export function VehicleDocumentsPage() {\n  const { id } = useParams<{ id: string }>();\n  const canEdit = usePermission(\"vehicles.edit\");",
    "VehicleDocumentsPage hook",
)
patch(
    docs_page,
    """        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-ink mb-3">Upload new document</h2>
          <VehicleDocumentUpload vehicleId={id} />
        </section>
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-ink mb-3">Documents</h2>
          <VehicleDocumentList vehicleId={id} />
        </section>""",
    """        {canEdit && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-ink mb-3">Upload new document</h2>
            <VehicleDocumentUpload vehicleId={id} />
          </section>
        )}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-ink mb-3">Documents</h2>
          <VehicleDocumentList vehicleId={id} canEdit={canEdit} />
        </section>""",
    "VehicleDocumentsPage sections",
)

# --- VehicleDocumentList ---
doc_list = ROOT / "vehicles" / "VehicleDocumentList.tsx"
patch(
    doc_list,
    'import { VEHICLE_DOCUMENT_LABELS, type VehicleDocumentType } from "../../constants/vehicleDocumentTypes";',
    'import { VEHICLE_DOCUMENT_LABELS, type VehicleDocumentType } from "../../constants/vehicleDocumentTypes";\nimport { usePermission } from "../../lib/permissions";',
    "VehicleDocumentList import",
)
patch(
    doc_list,
    "interface VehicleDocumentListProps {\n  vehicleId: string;\n}",
    "interface VehicleDocumentListProps {\n  vehicleId: string;\n  canEdit?: boolean;\n}",
    "VehicleDocumentList type",
)
patch(
    doc_list,
    "export function VehicleDocumentList({ vehicleId }: VehicleDocumentListProps) {",
    "export function VehicleDocumentList({ vehicleId, canEdit: canEditProp }: VehicleDocumentListProps) {\n  const canEditFromPermission = usePermission(\"vehicles.edit\");\n  const canEdit = canEditProp ?? canEditFromPermission;",
    "VehicleDocumentList hook",
)
patch(
    doc_list,
    '          <p className="mt-1 text-sm text-slate-500">Upload the first document using the form above.</p>',
    '          <p className="mt-1 text-sm text-slate-500">\n            {canEdit\n              ? "Upload the first document using the form above."\n              : "No documents have been uploaded for this vehicle yet."}\n          </p>',
    "VehicleDocumentList empty copy",
)
patch(
    doc_list,
    '                      <td className="px-3 py-2.5">\n                        <div className="flex flex-wrap items-center gap-3 text-xs">\n                          <button\n                            type="button"\n                            onClick={() => verifyMutation.mutate({ docId: doc.id, verified: !doc.is_verified })}\n                            disabled={verifyMutation.isPending}\n                            className="font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60"\n                          >\n                            {doc.is_verified ? "Mark unverified" : "Mark verified"}\n                          </button>\n                          <button\n                            type="button"\n                            onClick={() => setDeleteConfirm(doc.id)}\n                            className="font-medium text-red-600 hover:text-red-800"\n                          >\n                            Delete\n                          </button>\n                        </div>\n                      </td>',
    '                      <td className="px-3 py-2.5">\n                        {canEdit ? (\n                          <div className="flex flex-wrap items-center gap-3 text-xs">\n                            <button\n                              type="button"\n                              onClick={() => verifyMutation.mutate({ docId: doc.id, verified: !doc.is_verified })}\n                              disabled={verifyMutation.isPending}\n                              className="font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60"\n                            >\n                              {doc.is_verified ? "Mark unverified" : "Mark verified"}\n                            </button>\n                            <button\n                              type="button"\n                              onClick={() => setDeleteConfirm(doc.id)}\n                              className="font-medium text-red-600 hover:text-red-800"\n                            >\n                              Delete\n                            </button>\n                          </div>\n                        ) : (\n                          <span className="text-xs text-ink-muted">—</span>\n                        )}\n                      </td>',
    "VehicleDocumentList actions",
)

print("done")
