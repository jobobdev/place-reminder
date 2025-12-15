/**
 * 두 좌표 사이의 거리를 미터 단위로 계산
 * Haversine Formula 사용 (지구 곡률 고려)
 */
export function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3;

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
