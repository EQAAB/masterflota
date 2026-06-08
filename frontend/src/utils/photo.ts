/**
 * Authenticated API path for a driver profile photo.
 * Requires JWT + org context; fetch via useAuthenticatedImageUrl or api.get blob.
 */
export function getDriverPhotoApiPath(driverId: string): string {
  return `/drivers/${driverId}/photo`;
}
