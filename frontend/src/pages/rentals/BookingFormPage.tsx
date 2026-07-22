import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getVehicles, RENTAL_VEHICLE_DROPDOWN_LIMIT } from "../../api/vehicles";
import {
  createRentalBooking,
  getRentalBooking,
  getRentalCustomers,
  quickWeeklyRental,
  quoteRental,
  updateRentalBooking,
  type RentalQuote,
} from "../../api/rentals";
import { BookingDateTimeFields } from "../../components/rentals/booking-form/BookingDateTimeFields";
import { BookingDetailsSection } from "../../components/rentals/booking-form/BookingDetailsSection";
import { BookingFormCard } from "../../components/rentals/booking-form/BookingFormCard";
import { BookingFormFooter } from "../../components/rentals/booking-form/BookingFormFooter";
import { BookingFormHeader } from "../../components/rentals/booking-form/BookingFormHeader";
import { BookingSummarySidebar } from "../../components/rentals/booking-form/BookingSummarySidebar";
import { CustomerSelectField } from "../../components/rentals/booking-form/CustomerSelectField";
import { ExtraServicesChips } from "../../components/rentals/booking-form/ExtraServicesChips";
import { RentalTypeSegment } from "../../components/rentals/booking-form/RentalTypeSegment";
import { VehicleSelectField } from "../../components/rentals/booking-form/VehicleSelectField";
import {
  buildFormMetaPayload,
  combineDateAndTime,
  computeDisplayTotals,
  hydrateFormMeta,
  parseStartAtParam,
  splitIsoToDateTime,
  weeklyReturnDateFromPickup,
} from "../../components/rentals/booking-form/bookingFormUtils";

const RENTAL_TYPE_STORAGE_KEY = "fm.rentalType";

function readDefaultRentalType(): "daily" | "weekly" | "monthly" {
  const stored = localStorage.getItem(RENTAL_TYPE_STORAGE_KEY);
  if (stored === "daily" || stored === "weekly" || stored === "monthly") return stored;
  return "weekly";
}

export function BookingFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? "");
  const [vehicleId, setVehicleId] = useState(searchParams.get("vehicleId") ?? "");
  const [rentalType, setRentalType] = useState<"daily" | "weekly" | "monthly">(readDefaultRentalType);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const startParam = searchParams.get("startAt");
  const initialPickup = startParam ? parseStartAtParam(startParam) : { date: "", time: "10:00" };
  const [pickupDate, setPickupDate] = useState(initialPickup.date);
  const [pickupTime, setPickupTime] = useState(initialPickup.time);
  const [returnDate, setReturnDate] = useState(
    initialPickup.date ? weeklyReturnDateFromPickup(initialPickup.date) : "",
  );
  const [returnTime, setReturnTime] = useState(initialPickup.time || "10:00");

  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [quote, setQuote] = useState<RentalQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ["rentals", "customers", "booking-form"],
    queryFn: () => getRentalCustomers().then((r) => r.data),
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", "list-rental-booking"],
    queryFn: () => getVehicles({ limit: RENTAL_VEHICLE_DROPDOWN_LIMIT }).then((r) => r.data.data),
  });
  const existingQuery = useQuery({
    queryKey: ["rentals", "booking", id],
    queryFn: () => getRentalBooking(id!).then((r) => r.data),
    enabled: isEdit,
  });

  const existing = existingQuery.data;
  const isDraft = !isEdit || existing?.status === "draft";
  const formDisabled = isEdit && !isDraft;

  useEffect(() => {
    const b = existing;
    if (!b) return;
    setCustomerId(b.customer_id);
    setVehicleId(b.vehicle_id);
    setRentalType(b.rental_type);
    const start = splitIsoToDateTime(b.start_at);
    const end = splitIsoToDateTime(b.end_at);
    setPickupDate(start.date);
    setPickupTime(start.time);
    setReturnDate(end.date);
    setReturnTime(end.time);
    const meta = hydrateFormMeta(b.pricing_snapshot);
    setPickupLocation(meta.pickupLocation);
    setReturnLocation(meta.returnLocation);
    setDriverNotes(meta.driverNotes);
    setInternalNotes(meta.internalNotes);
    setSelectedExtras(meta.selectedExtras);
    setDiscountAmount(meta.discountAmount);
  }, [existing]);

  useEffect(() => {
    localStorage.setItem(RENTAL_TYPE_STORAGE_KEY, rentalType);
    if (rentalType === "weekly" && pickupDate) {
      setReturnDate(weeklyReturnDateFromPickup(pickupDate));
    }
  }, [rentalType, pickupDate]);

  const startIso = useMemo(
    () => combineDateAndTime(pickupDate, pickupTime),
    [pickupDate, pickupTime],
  );
  const endIso = useMemo(() => combineDateAndTime(returnDate, returnTime), [returnDate, returnTime]);

  useEffect(() => {
    if (!vehicleId || !startIso || !endIso) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setQuote(null);
      setQuoteError("Return must be after pickup");
      return;
    }
    setQuoteLoading(true);
    const t = setTimeout(() => {
      quoteRental({
        vehicleId,
        rentalType,
        startAt: startIso,
        endAt: endIso,
      })
        .then((r) => {
          setQuote(r.data);
          setQuoteError(r.data.conflict ? r.data.conflict.message : null);
        })
        .catch(() => {
          setQuote(null);
          setQuoteError("Could not get quote");
        })
        .finally(() => setQuoteLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [vehicleId, rentalType, startIso, endIso]);

  const customers = customersQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

  const totals = useMemo(
    () => computeDisplayTotals(quote, rentalType, selectedExtras, discountAmount),
    [quote, rentalType, selectedExtras, discountAmount],
  );

  const buildBody = () => {
    if (!customerId || !vehicleId || !startIso || !endIso) {
      throw new Error("Complete required fields");
    }
    const formMeta = buildFormMetaPayload({
      pickupLocation,
      returnLocation,
      driverNotes,
      internalNotes,
      selectedExtras,
      discountAmount,
    });
    return {
      customerId,
      vehicleId,
      rentalType,
      startAt: startIso,
      endAt: endIso,
      ...(formMeta ? { formMeta } : {}),
    };
  };

  const [savedFlash, setSavedFlash] = useState(false);

  const saveMut = useMutation({
    mutationFn: async (_navigateAfter: boolean) => {
      const body = buildBody();
      if (isEdit) {
        return updateRentalBooking(id!, body).then((r) => r.data);
      }
      return createRentalBooking(body).then((r) => r.data);
    },
    onSuccess: (b, navigateAfter) => {
      if (navigateAfter) {
        navigate(`/rentals/bookings/${b.id}`);
        return;
      }
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 3000);
      if (!isEdit) {
        navigate(`/rentals/bookings/${b.id}/edit`, { replace: true });
      }
    },
  });

  const quickStartMut = useMutation({
    mutationFn: () =>
      quickWeeklyRental({
        customerId,
        vehicleId,
        startAt: startIso!,
        endAt: endIso!,
        recordPayment: false,
        skipPickup: false,
      }),
    onSuccess: (res) => {
      navigate(`/rentals/bookings/${res.data.id}`);
    },
  });

  const canSubmit =
    !!customerId &&
    !!vehicleId &&
    !!startIso &&
    !!endIso &&
    isDraft &&
    !quoteError &&
    quote?.available !== false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    saveMut.mutate(true);
  };

  const handleSaveDraft = () => {
    if (!customerId || !vehicleId || !startIso || !endIso || !isDraft) return;
    saveMut.mutate(false);
  };

  const handleStartNow = () => {
    if (!customerId || !vehicleId || !startIso || !endIso || !isDraft) return;
    quickStartMut.mutate();
  };

  const rentalDays = quote?.days ?? null;

  return (
    <div className="fm-rental-booking-form flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <BookingFormHeader
        title={isEdit ? "Edit booking" : "New booking"}
        subtitle="Create a rental reservation and schedule vehicle pickup."
        backTo={isEdit ? `/rentals/bookings/${id}` : "/rentals/bookings"}
        backLabel={isEdit ? "Booking" : "Bookings"}
        statusBadge={isEdit ? existing?.status ?? "draft" : "Draft"}
        onSaveDraft={!formDisabled ? handleSaveDraft : undefined}
        saveDraftPending={saveMut.isPending}
        saveDraftDisabled={!canSubmit && !(customerId && vehicleId && startIso && endIso)}
      />

      {formDisabled && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/60">
          Only draft bookings can be edited.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-8">
          <div className="space-y-6">
            <BookingFormCard
              title="Reservation details"
              description="Choose customer, vehicle, rental period, and optional services."
            >
              <div className="space-y-6">
                <CustomerSelectField
                  customers={customers}
                  value={customerId}
                  onChange={setCustomerId}
                  disabled={formDisabled}
                />
                <VehicleSelectField
                  vehicles={vehicles}
                  value={vehicleId}
                  onChange={setVehicleId}
                  quote={quote}
                  quoteLoading={quoteLoading}
                  disabled={formDisabled}
                />
                <div>
                  <span className="block text-sm font-medium text-ink">Rental type</span>
                  <div className="mt-1.5">
                    <RentalTypeSegment
                      value={rentalType}
                      onChange={setRentalType}
                      disabled={formDisabled}
                    />
                  </div>
                </div>
                <BookingDateTimeFields
                  pickupDate={pickupDate}
                  pickupTime={pickupTime}
                  returnDate={returnDate}
                  returnTime={returnTime}
                  onPickupDate={setPickupDate}
                  onPickupTime={setPickupTime}
                  onReturnDate={setReturnDate}
                  onReturnTime={setReturnTime}
                  rentalDays={rentalDays}
                  disabled={formDisabled}
                />
                {quoteError && (
                  <p className="text-sm font-medium text-rose-700" role="alert">
                    {quoteError}
                  </p>
                )}
              </div>
            </BookingFormCard>

            <button
              type="button"
              className="text-sm font-medium text-brand hover:underline"
              onClick={() => setShowMoreOptions((v) => !v)}
            >
              {showMoreOptions ? "Hide more options" : "More options"}
            </button>

            {showMoreOptions && (
              <>
                <BookingFormCard
                  title="Booking details"
                  description="Optional pickup information, notes, and pricing adjustments."
                >
                  <BookingDetailsSection
                    pickupLocation={pickupLocation}
                    returnLocation={returnLocation}
                    driverNotes={driverNotes}
                    internalNotes={internalNotes}
                    discountAmount={discountAmount}
                    onPickupLocation={setPickupLocation}
                    onReturnLocation={setReturnLocation}
                    onDriverNotes={setDriverNotes}
                    onInternalNotes={setInternalNotes}
                    onDiscountAmount={setDiscountAmount}
                    disabled={formDisabled}
                  />
                </BookingFormCard>

                <BookingFormCard title="Extra services" description="Add optional services to this rental.">
                  <ExtraServicesChips
                    selected={selectedExtras}
                    onChange={setSelectedExtras}
                    disabled={formDisabled}
                  />
                </BookingFormCard>
              </>
            )}
          </div>

          <BookingSummarySidebar
            customer={selectedCustomer}
            vehicle={selectedVehicle}
            quote={quote}
            quoteLoading={quoteLoading}
            totals={totals}
            selectedExtras={selectedExtras}
            isEdit={isEdit}
          />
        </div>

        <BookingFormFooter
          isEdit={isEdit}
          onCancel={() => navigate(isEdit ? `/rentals/bookings/${id}` : "/rentals/bookings")}
          onSaveDraft={handleSaveDraft}
          onStartNow={!isEdit ? handleStartNow : undefined}
          saveDraftPending={saveMut.isPending}
          createPending={saveMut.isPending}
          startNowPending={quickStartMut.isPending}
          disabled={!canSubmit}
        />
      </form>

      {savedFlash && (
        <p className="mt-2 text-sm font-medium text-emerald-700" role="status">
          Draft saved.
        </p>
      )}
      {saveMut.isError && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          Could not save booking. Check required fields and availability.
        </p>
      )}
      {quickStartMut.isError && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          Could not start weekly rental. Check availability and try again.
        </p>
      )}
    </div>
  );
}
