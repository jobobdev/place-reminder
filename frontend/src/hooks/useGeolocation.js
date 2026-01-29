// frontend/src/hooks/useGeolocation.js
import { useEffect, useState } from "react";

export default function useGeolocation() {
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        console.log("[useGeolocation] position update", {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
        });

        setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading, // ✅ 추가 (없으면 null일 수 있음)
        });
      },
      (err) => {
        console.error("Error obtaining location", err);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10000,
        timeout: 20000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return currentPosition;
}
