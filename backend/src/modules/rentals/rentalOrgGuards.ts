import { query } from "../../db/pool";

export class RentalOrgScopeError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type AssertRentalCustomerOptions = {
  requireActive?: boolean;
};

export async function assertRentalCustomerInOrg(
  customerId: string,
  orgId: string,
  options: AssertRentalCustomerOptions = {},
): Promise<void> {
  const { requireActive = false } = options;
  const activeSql = requireActive ? " AND is_active = true" : "";
  const { rows } = await query<{ id: string }>(
    `SELECT id::text FROM rental_customers
     WHERE id = $1::uuid AND organization_id = $2::uuid${activeSql}`,
    [customerId, orgId],
  );
  if (!rows[0]) {
    throw new RentalOrgScopeError("Customer not found");
  }
}

export async function assertVehicleInOrg(vehicleId: string, orgId: string): Promise<void> {
  const { rows } = await query<{ id: string }>(
    `SELECT id::text FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId],
  );
  if (!rows[0]) {
    throw new RentalOrgScopeError("Vehicle not found");
  }
}
