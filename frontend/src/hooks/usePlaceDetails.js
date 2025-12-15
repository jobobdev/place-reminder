import {} from "react";

/*
  ⭐ usePlaceDetails Hook

  역할:
  - Google Places Details API 호출을 전담
  - placeId를 받아서:
    1) 상세 정보 요청
    2) 지도 중심 이동
    3) 선택한 장소 좌표 state 업데이트
    4) 모달에 넣을 정보 state 업데이트
    5) 모달 열기

  이 hook 자체는 UI를 가지지 않고,
  App.jsx에서 전달받은 setState 함수들을 사용해서 화면을 갱신한다.
*/

export default function usePlaceDetails(
  mapInstance, // 지도 인스턴스
  setSelectedPlacePosition, // 선택한 장소 좌표 state 업데이트 함수
  setSelectedPlaceInfo, // 모달에 표시할 장소 정보 state 업데이트 함수
  setModalOpen // 모달 열기 state 업데이트 함수
) {
  // placeID를 받아서 실제로 상세 정보를 가져오는 함수
  const fetchPlaceDetails = (placeId) => {
    if (!mapInstance) {
      console.warn("⚠️ 지도 인스턴스가 아직 준비되지 않았습니다.");
      return;
    }

    if (!placeId) {
      console.error("❌ 유효하지 않은 placeId:", placeId);
      return;
    }

    // PlacesService 인스턴스 생성
    const service = new window.google.maps.places.PlacesService(mapInstance);

    const request = {
      placeId,
      fields: [
        "name",
        "formatted_address",
        "geometry",
        "formatted_phone_number",
        "opening_hours",
        "user_ratings_total",
      ],
    };

    // PlaceDetails 요청
    service.getDetails(request, (place, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
        console.error("❌ 장소 상세 정보 요청 실패:", status);
        return;
      }

      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      // 1) 지도 중심 이동
      mapInstance.panTo(position);

      // 2) 선택한 장소 위치 State에 저장 -> 마커 표시
      setSelectedPlacePosition(position);

      // 3) 모달에 쓸 기본 정보 저장
      setSelectedPlaceInfo({
        name: place.name || "이름 정보 없음",
        address: place.formatted_address || "주소 정보 없음",
        rating: place.rating,
        reviews: place.user_ratings_total,
        hours: place.opening_hours?.weekday_text || [
          "운영 시간 정보가 없습니다.",
        ],
        position,
      });

      // 4) 모달 열기
      setModalOpen(true);
    });
  };

  // App.jsx에서 사용할 함수 반환
  return fetchPlaceDetails;
}
