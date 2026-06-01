import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createRentalCustomer, getRentalCustomer, updateRentalCustomer } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { btnPrimary, btnSecondary } from "../../theme/classNames";

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [legalName, setLegalName] = useState("");
  const [customerType, setCustomerType] = useState<"company" | "individual">("individual");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");

  const existing = useQuery({
    queryKey: ["rentals", "customer", id],
    queryFn: () => getRentalCustomer(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    const c = existing.data;
    if (!c) return;
    setLegalName(c.legal_name);
    setCustomerType(c.customer_type);
    setContactName(c.contact_name ?? "");
    setEmail(c.email ?? "");
    setPhone(c.phone ?? "");
    setTaxId(c.tax_id ?? "");
    setNotes(c.notes ?? "");
  }, [existing.data]);

  const saveMut = useMutation({
    mutationFn: () => {
      const body = { legalName, customerType, contactName, email, phone, taxId, notes };
      if (isEdit) return updateRentalCustomer(id!, body);
      return createRentalCustomer(body);
    },
    onSuccess: () => navigate("/rentals/customers"),
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title={isEdit ? "Edit customer" : "New customer"}
        backTo="/rentals/customers"
      />
      <form
        className="max-w-lg space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <label className="block text-sm">
          Type
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as typeof customerType)}
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
        </label>
        <label className="block text-sm">
          Legal name *
          <input
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Contact name
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Phone
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Tax ID
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Notes
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button type="submit" className={btnPrimary} disabled={saveMut.isPending}>
          Save
        </button>
        <button type="button" className={`${btnSecondary} ml-2`} onClick={() => navigate(-1)}>
          Cancel
        </button>
      </form>
    </div>
  );
}
