import type { DaySegment } from "./availabilityListUtils";

type AvailabilityMiniTimelineProps = {
  segments: DaySegment[];
};

const SEG_CLASS: Record<DaySegment["state"], string> = {
  available: "fm-rental-availability__timeline-seg--available",
  booked: "fm-rental-availability__timeline-seg--booked",
  blocked: "fm-rental-availability__timeline-seg--blocked",
  maintenance: "fm-rental-availability__timeline-seg--maintenance",
};

export function AvailabilityMiniTimeline({ segments }: AvailabilityMiniTimelineProps) {
  if (segments.length === 0) return null;

  return (
    <div className="fm-rental-availability__timeline" role="img" aria-label="Availability timeline">
      {segments.map((seg) => (
        <span
          key={seg.date}
          className={`fm-rental-availability__timeline-seg ${SEG_CLASS[seg.state]}`}
          title={`${seg.date}: ${seg.state}`}
        />
      ))}
    </div>
  );
}
