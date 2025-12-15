// hooks/useMapClick.js

export default function useMapClick(fetchPlaceDetails) {
  return (e) => {
    // 🔥 가장 먼저 기본 동작 차단
    if (e.stop) {
      e.stop();
    }

    // 1️⃣ POI 클릭 (placeId 있음)
    if (e.placeId) {
      fetchPlaceDetails(e.placeId);
      return;
    }

    // 2️⃣ 일반 지도 클릭 → Reverse Geocoding
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.length) return;

      const placeId = results[0].place_id;
      if (placeId) {
        fetchPlaceDetails(placeId);
      }
    });
  };
}
