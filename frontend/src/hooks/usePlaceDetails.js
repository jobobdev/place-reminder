export default function usePlaceDetails(
  mapInstance,
  setSelectedGooglePlace,
  setSelectedPlaceInfo,
  openSheet
) {
  const fetchPlaceDetails = (placeId) => {
    if (!mapInstance || !placeId) return;

    const service = new window.google.maps.places.PlacesService(mapInstance);

    service.getDetails(
      {
        placeId,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "opening_hours",
          "rating",
          "user_ratings_total",
        ],
      },
      (place, status) => {
        if (
          status !== window.google.maps.places.PlacesServiceStatus.OK ||
          !place?.geometry
        ) {
          return;
        }

        const position = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // 지도 이동
        mapInstance.panTo(position);

        // Google Place 원본 (선택)
        if (typeof setSelectedGooglePlace === "function") {
          setSelectedGooglePlace(place);
        }

        // 🔥 sheet 전용 단일 데이터
        setSelectedPlaceInfo({
          type: "google",
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          rating: place.rating ?? null,
          reviews: place.user_ratings_total ?? 0,
          hours: place.opening_hours?.weekday_text || [],
          position,
          myRating: null,
          memo: {
            text: "",
            tag: "before",
          },
        });
        // 🔥 sheet 전용 단일 데이터
        setSelectedPlaceInfo({
          type: "google",
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          rating: place.rating ?? null,
          reviews: place.user_ratings_total ?? 0,
          hours: place.opening_hours?.weekday_text || [],
          position,
          myRating: null,
          memo: {
            text: "",
            tag: "before",
          },
        });

        // ✅ 반드시 여기
        if (typeof openSheet === "function") {
          openSheet(); // ← sheetState = "partial"
        }
      }
    );
  };

  return fetchPlaceDetails;
}
