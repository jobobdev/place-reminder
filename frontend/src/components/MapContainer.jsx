// components/MapContainer.jsx

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useEffect, useRef } from "react";

export default function MapContainer({
  currentLocation,
  selectedPosition, // 🔥 단 하나의 기준
  savedPlaces,
  onMapLoad,
  onMapClick,
  onSavedPlaceClick,
}) {
  const mapRef = useRef(null);

  // 🔥 선택된 좌표가 바뀌면 항상 동일하게 pan + zoom
  useEffect(() => {
    if (!selectedPosition || !mapRef.current) return;

    mapRef.current.panTo(selectedPosition);
    mapRef.current.setZoom(16);
  }, [selectedPosition]);

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={currentLocation || { lat: 37.5665, lng: 126.978 }}
      zoom={14}
      onLoad={(map) => {
        mapRef.current = map;
        if (onMapLoad) onMapLoad(map);
      }}
      onClick={onMapClick}
      options={{
        clickableIcons: true,
        gestureHandling: "greedy",
        disableDoubleClickZoom: true,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      }}
    >
      {/* 현재 위치 */}
      {currentLocation && <Marker position={currentLocation} />}

      {/* 저장된 장소 핀 */}
      {savedPlaces.map((place) => (
        <Marker
          key={place._id}
          position={{
            lat: place.position.lat,
            lng: place.position.lng,
          }}
          onClick={() => {
            if (typeof onSavedPlaceClick === "function") {
              onSavedPlaceClick(place);
            }
          }}
        />
      ))}

      {/* 선택된 장소 강조 핀 */}
      {selectedPosition && (
        <Marker
          position={selectedPosition}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new window.google.maps.Size(40, 40),
          }}
        />
      )}
    </GoogleMap>
  );
}
