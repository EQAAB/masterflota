import { api } from "../lib/api";

// --- Types ---

export interface FiscalProfile {
  id: string;
  organization_id: string;
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
  bank_name: string | null;
  bank_iban: string | null;
  legal_representative: string | null;
  phone: string | null;
  email: string | null;
}

export interface FiscalProfileInput {
  cui: string;
  companyName: string;
  regCom?: string;
  isVatPayer?: boolean;
  vatCode?: string;
  addressCounty?: string;
  addressCity?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressZip?: string;
  bankName?: string;
  bankIban?: string;
  legalRepresentative?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceSeries {
  id: string;
  organization_id: string;
  prefix: string;
  next_number: number;
  is_default: boolean;
  is_active: boolean;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
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

export interface Invoice {
  id: string;
  organization_id: string;
  series_id: string;
  series_prefix: string;
  invoice_number: number;
  status: string;
  issue_date: string;
  due_date: string | null;
  delivery_date: string | null;
  buyer_name: string;
  buyer_cui: string | null;
  buyer_reg_com: string | null;
  buyer_address_county: string | null;
  buyer_address_city: string | null;
  buyer_address_street: string | null;
  buyer_address_number: string | null;
  buyer_address_zip: string | null;
  buyer_is_vat_payer: boolean;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_bank_name: string | null;
  buyer_bank_iban: string | null;
  currency: string;
  net_amount: string;
  vat_amount: string;
  total_amount: string;
  anaf_upload_index: string | null;
  anaf_download_id: string | null;
  anaf_status: string | null;
  anaf_error_message: string | null;
  anaf_submitted_at: string | null;
  source_type: string | null;
  rental_booking_id: string | null;
  storno_of_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  lines?: InvoiceLine[];
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
}

export interface CreateInvoiceInput {
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
  lines: InvoiceLineInput[];
}

export interface AnafConnectionStatus {
  connected: boolean;
  connectionMethod: string | null;
  cui: string | null;
  expiresAt: string | null;
  connectedAt: string | null;
  certificate: {
    uploaded: boolean;
    serial?: string;
    subject?: string;
    uploadedAt?: string;
  };
  provider: {
    configured: boolean;
    provider?: string;
    companyCui?: string;
    isActive?: boolean;
    connectedAt?: string;
  };
}

// --- API calls ---

export const getFiscalProfile = () =>
  api.get<FiscalProfile | null>("/invoicing/fiscal-profile");

export const saveFiscalProfile = (data: FiscalProfileInput) =>
  api.put<FiscalProfile>("/invoicing/fiscal-profile", data);

export const getInvoiceSeries = () =>
  api.get<InvoiceSeries[]>("/invoicing/series");

export const createInvoiceSeries = (data: { prefix: string; startNumber?: number; isDefault?: boolean }) =>
  api.post<InvoiceSeries>("/invoicing/series", data);

export const updateInvoiceSeries = (id: string, data: { isActive?: boolean; isDefault?: boolean }) =>
  api.patch<InvoiceSeries>(`/invoicing/series/${id}`, data);

export const getInvoices = (params?: { status?: string; from?: string; to?: string; q?: string }) =>
  api.get<Invoice[]>("/invoicing/invoices", { params });

export const getInvoice = (id: string) =>
  api.get<Invoice>(`/invoicing/invoices/${id}`);

export const createInvoice = (data: CreateInvoiceInput) =>
  api.post<Invoice>("/invoicing/invoices", data);

export const issueInvoice = (id: string) =>
  api.post<Invoice>(`/invoicing/invoices/${id}/issue`);

export const cancelInvoice = (id: string) =>
  api.post<Invoice>(`/invoicing/invoices/${id}/cancel`);

export const submitInvoiceToAnaf = (id: string) =>
  api.post<{ uploadIndex: string }>(`/invoicing/invoices/${id}/submit-anaf`);

export const getInvoiceAnafStatus = (id: string) =>
  api.get<{ status: string; anafState: string; downloadId: string | null; errorMsg: string | null }>(
    `/invoicing/invoices/${id}/anaf-status`,
  );

export const downloadInvoiceXml = async (id: string) => {
  const resp = await api.get(`/invoicing/invoices/${id}/xml`, { responseType: "blob" });
  return resp;
};

export const getAnafConnectionStatus = () =>
  api.get<AnafConnectionStatus>("/invoicing/anaf/status");

export const initiateAnafConnection = () =>
  api.post<{ authUrl: string }>("/invoicing/anaf/connect");

export const disconnectAnaf = () =>
  api.post("/invoicing/anaf/disconnect");

// Certificate upload
export const uploadAnafCertificate = (file: File, password: string) => {
  const formData = new FormData();
  formData.append("certificate", file);
  formData.append("password", password);
  return api.post<{ uploaded: boolean; message: string }>("/invoicing/certificate/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteAnafCertificate = () =>
  api.delete("/invoicing/certificate");

// Provider API (SmartBill / Oblio)
export const connectProvider = (data: { provider: string; apiKey: string; apiSecret?: string; companyCui?: string }) =>
  api.post<{ configured: boolean; provider: string }>("/invoicing/provider/connect", data);

export const disconnectProvider = () =>
  api.delete("/invoicing/provider");
