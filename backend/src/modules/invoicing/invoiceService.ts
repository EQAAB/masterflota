import { invoicingDb } from "./invoicingDb";

export interface CreateInvoiceInput {
  orgId: string;
  seriesId: string;
  issueDate: string;
  dueDate?: string;
  deliveryDate?: string;
  buyerName: string;
  buyerCui?: string;
  buyerRegCom?: string;
  buyerAddressCounty?: string;
  buyerAddressCity?: string;
  buyerAddressStreet?: string;
  buyerAddressNumber?: string;
  buyerAddressZip?: string;
  buyerIsVatPayer?: boolean;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerBankName?: string;
  buyerBankIban?: string;
  currency?: string;
  sourceType?: string;
  rentalBookingId?: string;
  notes?: string;
  createdBy?: string;
  lines: InvoiceLineInput[];
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
}

function computeLineAmounts(line: InvoiceLineInput) {
  const net = Math.round(line.quantity * line.unitPrice * 100) / 100;
  const vat = Math.round(net * (line.vatRate / 100) * 100) / 100;
  return { net, vat, total: Math.round((net + vat) * 100) / 100 };
}

export async function createInvoice(input: CreateInvoiceInput) {
  const { rows: seriesRows } = await invoicingDb.query(
    `UPDATE invoice_series
     SET next_number = next_number + 1, updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid AND is_active = true
     RETURNING prefix, next_number - 1 AS assigned_number`,
    [input.seriesId, input.orgId],
  );

  if (!seriesRows.length) {
    throw new Error("Invoice series not found or inactive");
  }

  const { prefix, assigned_number } = seriesRows[0] as { prefix: string; assigned_number: number };

  let totalNet = 0;
  let totalVat = 0;
  const computedLines = input.lines.map((l, i) => {
    const amounts = computeLineAmounts(l);
    totalNet += amounts.net;
    totalVat += amounts.vat;
    return { ...l, lineNumber: i + 1, ...amounts };
  });
  const totalAmount = Math.round((totalNet + totalVat) * 100) / 100;

  const { rows } = await invoicingDb.query(
    `INSERT INTO invoices (
        organization_id, series_id, series_prefix, invoice_number,
        issue_date, due_date, delivery_date,
        buyer_name, buyer_cui, buyer_reg_com,
        buyer_address_county, buyer_address_city, buyer_address_street,
        buyer_address_number, buyer_address_zip,
        buyer_is_vat_payer, buyer_email, buyer_phone,
        buyer_bank_name, buyer_bank_iban,
        currency, net_amount, vat_amount, total_amount,
        source_type, rental_booking_id, notes, created_by
     ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28
     ) RETURNING *`,
    [
      input.orgId, input.seriesId, prefix, assigned_number,
      input.issueDate, input.dueDate ?? null, input.deliveryDate ?? null,
      input.buyerName, input.buyerCui ?? null, input.buyerRegCom ?? null,
      input.buyerAddressCounty ?? null, input.buyerAddressCity ?? null,
      input.buyerAddressStreet ?? null, input.buyerAddressNumber ?? null,
      input.buyerAddressZip ?? null, input.buyerIsVatPayer ?? false,
      input.buyerEmail ?? null, input.buyerPhone ?? null,
      input.buyerBankName ?? null, input.buyerBankIban ?? null,
      input.currency ?? "RON", totalNet, totalVat, totalAmount,
      input.sourceType ?? null, input.rentalBookingId ?? null,
      input.notes ?? null, input.createdBy ?? null,
    ],
  );

  for (const line of computedLines) {
    await invoicingDb.query(
      `INSERT INTO invoice_lines (invoice_id, line_number, description, quantity, unit, unit_price, vat_rate, net_amount, vat_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        rows[0].id, line.lineNumber, line.description,
        line.quantity, line.unit ?? "buc", line.unitPrice,
        line.vatRate, line.net, line.vat, line.total,
      ],
    );
  }

  return rows[0];
}

export async function issueInvoice(invoiceId: string, orgId: string) {
  const { rows } = await invoicingDb.query(
    `UPDATE invoices SET status = 'issued', updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'draft'
     RETURNING *`,
    [invoiceId, orgId],
  );
  if (!rows.length) {
    throw new Error("Invoice not found or not in draft status");
  }
  return rows[0];
}

export async function cancelInvoice(invoiceId: string, orgId: string) {
  const { rows } = await invoicingDb.query(
    `UPDATE invoices SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'draft'
     RETURNING *`,
    [invoiceId, orgId],
  );
  if (!rows.length) {
    throw new Error("Invoice not found or cannot be cancelled");
  }
  return rows[0];
}
