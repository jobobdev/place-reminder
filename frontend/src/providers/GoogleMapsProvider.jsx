import { LoadScript } from "@react-google-maps/api";

// Google Maps SDK에서 사용할 라이브러리 목록
// places: 장소 검색, Place Details, Autocomplete 등에 필수
const libraries = ["places"];

/**
 * Google Maps SDK를 한 번만 로드하기 위한 Provider
 * App 전체를 감싸서 하위 컴포넌트에서 window.google 사용 가능하게 함
 */
export default function GoogleMapsProvider({ children }) {
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
}
