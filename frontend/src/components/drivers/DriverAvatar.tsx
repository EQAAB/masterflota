import { getDriverPhotoApiPath } from "../../utils/photo";
import { useAuthenticatedImageUrl } from "../../hooks/useAuthenticatedImageUrl";

interface DriverAvatarProps {
  driverId: string;
  profilePhotoUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-20 h-20 text-lg",
};

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName ?? "").trim().charAt(0);
  const l = (lastName ?? "").trim().charAt(0);
  if (f || l) return `${f}${l}`.toUpperCase();
  return "?";
}

export function DriverAvatar({
  driverId,
  profilePhotoUrl,
  firstName,
  lastName,
  size = "md",
  className = "",
}: DriverAvatarProps) {
  const hasPhoto = Boolean(profilePhotoUrl?.trim());
  const { url: photoUrl, error } = useAuthenticatedImageUrl(
    getDriverPhotoApiPath(driverId),
    hasPhoto,
  );
  const sizeClass = sizeClasses[size];

  if (hasPhoto && photoUrl && !error) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-brand-mint text-brand flex items-center justify-center font-medium shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
