/**
 * CIUS-RO UBL 2.1 invoice XML generator.
 * Produces a minimal valid e-Factura XML for ANAF submission.
 */

interface Issuer {
  cui: string;
  company_name: string;
  reg_com: string | null;
  is_vat_payer: boolean;
  vat_code: string | null;
  address_county: string | null;
  address_city: string | null;
  address_street: string | null;
  address_number: string | null;
  address_zip: string | null;
  phone: string | null;
  email: string | null;
  bank_iban: string | null;
  bank_name: string | null;
}

interface InvoiceData {
  series_prefix: string;
  invoice_number: number;
  issue_date: string;
  due_date: string | null;
  delivery_date: string | null;
  currency: string;
  net_amount: string;
  vat_amount: string;
  total_amount: string;
  buyer_name: string;
  buyer_cui: string | null;
  buyer_reg_com: string | null;
  buyer_is_vat_payer: boolean;
  buyer_address_county: string | null;
  buyer_address_city: string | null;
  buyer_address_street: string | null;
  buyer_address_number: string | null;
  buyer_address_zip: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  buyer_bank_iban: string | null;
  buyer_bank_name: string | null;
  notes: string | null;
}

interface InvoiceLine {
  line_number: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  vat_rate: string;
  net_amount: string;
  vat_amount: string;
  total_amount: string;
}

function esc(val: string | null | undefined): string {
  if (!val) return "";
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: string | Date | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

function buildAddress(
  street: string | null, number: string | null,
  city: string | null, county: string | null, zip: string | null,
): string {
  const line = [street, number].filter(Boolean).join(" ");
  return `
      <cac:PostalAddress>
        ${line ? `<cbc:StreetName>${esc(line)}</cbc:StreetName>` : ""}
        ${city ? `<cbc:CityName>${esc(city)}</cbc:CityName>` : ""}
        ${zip ? `<cbc:PostalZone>${esc(zip)}</cbc:PostalZone>` : ""}
        ${county ? `<cbc:CountrySubentity>${esc(county)}</cbc:CountrySubentity>` : ""}
        <cac:Country>
          <cbc:IdentificationCode>RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>`;
}

function vatScheme(cui: string | null, isVat: boolean): string {
  const cleanCui = cui?.replace(/^RO/i, "") ?? "";
  const schemeCui = isVat ? `RO${cleanCui}` : cleanCui;
  return `
        <cac:PartyTaxScheme>
          <cbc:CompanyID>${esc(schemeCui)}</cbc:CompanyID>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>`;
}

export function buildInvoiceXml(
  issuer: Issuer,
  invoice: InvoiceData,
  lines: InvoiceLine[],
): string {
  const invoiceId = `${invoice.series_prefix}${invoice.invoice_number}`;
  const issueDate = formatDate(invoice.issue_date);
  const dueDate = invoice.due_date ? formatDate(invoice.due_date) : issueDate;

  const vatBreakdown = new Map<string, { net: number; vat: number }>();
  for (const line of lines) {
    const rate = line.vat_rate;
    const existing = vatBreakdown.get(rate) ?? { net: 0, vat: 0 };
    existing.net += parseFloat(line.net_amount);
    existing.vat += parseFloat(line.vat_amount);
    vatBreakdown.set(rate, existing);
  }

  const taxSubtotals = Array.from(vatBreakdown.entries()).map(([rate, { net, vat }]) => `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${invoice.currency}">${net.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${invoice.currency}">${vat.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${rate}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>`).join("");

  const invoiceLines = lines.map((l) => `
    <cac:InvoiceLine>
      <cbc:ID>${l.line_number}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${esc(l.unit)}">${l.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${invoice.currency}">${l.net_amount}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${esc(l.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${l.vat_rate}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${invoice.currency}">${l.unit_price}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ID>${esc(invoiceId)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${invoice.notes ? `<cbc:Note>${esc(invoice.notes)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      ${buildAddress(issuer.address_street, issuer.address_number, issuer.address_city, issuer.address_county, issuer.address_zip)}
      ${vatScheme(issuer.cui, issuer.is_vat_payer)}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(issuer.company_name)}</cbc:RegistrationName>
        ${issuer.reg_com ? `<cbc:CompanyID>${esc(issuer.reg_com)}</cbc:CompanyID>` : ""}
      </cac:PartyLegalEntity>
      ${issuer.email ? `<cac:Contact><cbc:ElectronicMail>${esc(issuer.email)}</cbc:ElectronicMail></cac:Contact>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      ${buildAddress(invoice.buyer_address_street, invoice.buyer_address_number, invoice.buyer_address_city, invoice.buyer_address_county, invoice.buyer_address_zip)}
      ${vatScheme(invoice.buyer_cui, invoice.buyer_is_vat_payer)}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(invoice.buyer_name)}</cbc:RegistrationName>
        ${invoice.buyer_reg_com ? `<cbc:CompanyID>${esc(invoice.buyer_reg_com)}</cbc:CompanyID>` : ""}
      </cac:PartyLegalEntity>
      ${invoice.buyer_email ? `<cac:Contact><cbc:ElectronicMail>${esc(invoice.buyer_email)}</cbc:ElectronicMail></cac:Contact>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>

  ${invoice.delivery_date ? `
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${formatDate(invoice.delivery_date)}</cbc:ActualDeliveryDate>
  </cac:Delivery>` : ""}

  ${issuer.bank_iban ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc(issuer.bank_iban)}</cbc:ID>
      ${issuer.bank_name ? `<cbc:Name>${esc(issuer.bank_name)}</cbc:Name>` : ""}
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>` : ""}

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency}">${invoice.vat_amount}</cbc:TaxAmount>
    ${taxSubtotals}
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${invoice.net_amount}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${invoice.net_amount}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${invoice.total_amount}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${invoice.total_amount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${invoiceLines}
</Invoice>`;
}
