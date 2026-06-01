import type { ReactNode } from "react";

type CustomerFormCardProps = {
  children: ReactNode;
};

export function CustomerFormCard({ children }: CustomerFormCardProps) {
  return (
    <section className="fm-rental-customer-form__card">
      <header className="mb-6">
        <h2 className="text-base font-semibold text-ink">Customer details</h2>
        <p className="mt-1 text-sm text-ink-muted">Enter basic customer and billing information.</p>
      </header>
      {children}
    </section>
  );
}
