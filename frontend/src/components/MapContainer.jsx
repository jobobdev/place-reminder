// components/MapContainer.jsx

import { GoogleMap, Marker } from "@react-google-maps/api";

export default function MapContainer({
  currentLocation,
  selectedPlacePosition,
  savedPlaces,
  onMapLoad,
  onMapClick,
}) {
  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={currentLocation || { lat: 37.5665, lng: 126.978 }}
      zoom={14}
      onLoad={onMapLoad}
      onClick={onMapClick}
      options={{
        clickableIcons: true, // 🔥 POI 클릭 이벤트 허용
        gestureHandling: "greedy", // 클릭 우선
        disableDoubleClickZoom: true,
      }}
    >
      {currentLocation && <Marker position={currentLocation} />}

      {selectedPlacePosition && <Marker position={selectedPlacePosition} />}

      {savedPlaces.map((place) => (
        <Marker
          key={place._id}
          position={{
            lat: place.position.lat,
            lng: place.position.lng,
          }}
        />
      ))}
    </GoogleMap>
  );
}
