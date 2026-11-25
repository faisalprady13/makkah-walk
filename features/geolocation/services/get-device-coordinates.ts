import type { Coordinates } from "@/domain/entities/coordinates";

export function getDeviceCoordinates(): Promise<Coordinates> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Location services are not supported by this browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Location permission was denied. You can still search for a place."));
        } else if (error.code === error.TIMEOUT) {
          reject(new Error("Your location could not be found in time. Please try again."));
        } else {
          reject(new Error("Your current location is unavailable. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  });
}
