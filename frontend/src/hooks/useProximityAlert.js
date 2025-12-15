// src/hooks/useProximityAlert.js

import { useEffect } from "react";
import { getDistanceFromLatLonInM } from "../utils/distance";
import { showNotification } from "../utils/notification";

/**
 * 현재 위치가 저장된 장소 반경(radius) 안으로 들어오면 알림을 띄우는 Hook
 *
 * - currentPosition: { lat, lng } (현재 위치)
 * - savedPlaces: DB에서 가져온 저장 장소 배열
 * - notifiedPlaces: 이미 알림 보낸 place._id 목록
 * - setNotifiedPlaces: notifiedPlaces 업데이트 함수
 * - radius: 반경(미터), 기본 100m
 */
export default function useProximityAlert({
  currentPosition,
  savedPlaces,
  notifiedPlaces,
  setNotifiedPlaces,
  radius = 100,
}) {
  useEffect(() => {
    if (!currentPosition || savedPlaces.length === 0) return;

    savedPlaces.forEach((place) => {
      // place.position = { lat, lng } 라는 전제
      const dist = getDistanceFromLatLonInM(
        currentPosition.lat,
        currentPosition.lng,
        place.position.lat,
        place.position.lng
      );

      if (dist < radius && !notifiedPlaces.includes(place._id)) {
        showNotification(
          `📍 저장된 장소 ${place.name} 근처입니다!`,
          `${dist.toFixed(1)}m 남음`
        );

        setNotifiedPlaces((prev) => [...prev, place._id]);
      }
    });
  }, [currentPosition, savedPlaces]); // eslint 경고를 줄이려면 나중에 notifiedPlaces도 포함 가능
}
