import { useEffect, useState } from "react";

/*
  ⭐ useGeolocation Hook
  - 브라우저의 현재 위치(GPS)를 추적하는 기능만 담당
  - UI는 없음 (오직 데이터 처리만 함)
  - App.jsx는 이 hook을 호출해서 currentPosition만 받아온다.

  장점:
  - 위치 추적 로직을 App.jsx에서 제거 → 코드 가벼워짐
  - 테스트/유지보수 쉬워짐
*/

export default function useGeolocation(mapInstance) {
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCurrentPosition(newPos);

        // 지도 인스턴스가 있으면 위치 변경 시마다 지도 중심 이동
        if (mapInstance) {
          mapInstance.panTo(newPos);
        }
      },
      (err) => console.error("📌 위치 추적 오류", err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    // 정리 함수: 컴포넌트 언마운트 시 위치 추적 중지

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mapInstance]);

  return currentPosition;
}
