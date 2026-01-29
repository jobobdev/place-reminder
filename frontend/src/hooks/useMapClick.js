// hooks/useMapClick.js

export default function useMapClick(fetchPlaceDetails, setSelectedPlaceSource) {
  return (e) => {
    // Google Maps 기본 동작 중단
    if (e.stop) e.stop();

    // ✅ POI 클릭만 허용
    if (!e.placeId) {
      // ❌ 일반 지도 클릭은 완전히 무시
      return;
    }

    // 선택 출처 기록
    if (typeof setSelectedPlaceSource === "function") {
      setSelectedPlaceSource("map");
    }

    // POI 상세 조회
    fetchPlaceDetails(e.placeId);
  };
}
