import type { ReactNode } from "react";

type BookingFormCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function BookingFormCard({ title, description, children, className = "" }: BookingFormCardProps) {
  return (
    <section className={`fm-rental-booking-form__card ${className}`}>
      <header className="mb-5">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </header>
      {children}
    </section>
  );
}
