import { useParams, Link } from "react-router-dom";
import { VehicleDocumentUpload } from "../../components/vehicles/VehicleDocumentUpload";
import { usePermission } from "../../lib/permissions";
import { VehicleDocumentList } from "../../components/vehicles/VehicleDocumentList";

export function VehicleDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const canEdit = usePermission("vehicles.edit");

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <p className="text-red-600">Missing vehicle ID.</p>
          <Link to="/vehicles" className="mt-3 inline-block text-sm text-brand hover:underline">
            Back to vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100">
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vehicles" className="text-sm text-ink-muted hover:text-ink">
            Vehicles
          </Link>
          <h1 className="text-xl font-semibold text-ink">Vehicle documents</h1>
        </div>
      </header>
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {canEdit && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-ink mb-3">Upload new document</h2>
            <VehicleDocumentUpload vehicleId={id} />
          </section>
        )}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-ink mb-3">Documents</h2>
          <VehicleDocumentList vehicleId={id} canEdit={canEdit} />
        </section>
      </main>
    </div>
  );
}

