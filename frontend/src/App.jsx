/* =========================================================
 * App.jsx
 * ---------------------------------------------------------
 * 역할:
 * 1. 앱 전체에서 공유되는 state 관리
 * 2. 커스텀 hooks들을 조합하여 비즈니스 로직 구성
 * 3. UI 컴포넌트들을 조립(render)
 *
 * ❌ 직접 계산, API 로직, 지도 SDK 로딩은 하지 않음
 * ========================================================= */

/* ===================== Components ===================== */
import BasicInfoModal from "./components/BasicInfoModal";
import MapContainer from "./components/MapContainer.jsx";
import SearchBar from "./components/Searchbar.jsx";
import RecenterButton from "./components/RecenterButton.jsx";

/* ======================= Hooks ======================== */
import useGeolocation from "./hooks/useGeolocation.js";
import usePlaceDetails from "./hooks/usePlaceDetails.js";
import useMapClick from "./hooks/useMapClick.js";
import useProximityAlert from "./hooks/useProximityAlert.js";
import useNotificationPermission from "./hooks/useNotificationPermission.js";

/* ===================== Providers ====================== */
import GoogleMapsProvider from "./providers/GoogleMapsProvider";

/* ======================= React ======================== */
import { useEffect, useState } from "react";

function App() {
  /* =====================================================
   * 1️⃣ STATE 영역
   * -----------------------------------------------------
   * - App 전반에서 공유되는 “데이터의 원본(Source of Truth)”
   * - 하위 컴포넌트들은 이 state를 props로만 전달받음
   * ===================================================== */

  // 이미 알림을 보낸 장소 ID 목록 (중복 알림 방지용)
  const [notifiedPlaces, setNotifiedPlaces] = useState([]);

  // DB에 저장된 모든 장소 리스트
  const [savedPlaces, setSavedPlaces] = useState([]);

  // Google Map 인스턴스 (panTo, addListener 등에 사용)
  const [mapInstance, setMapInstance] = useState(null);

  // 현재 선택된 장소의 좌표 (마커 표시용)
  const [selectedPlacePosition, setSelectedPlacePosition] = useState(null);

  // 현재 선택된 장소의 상세 정보 (모달 표시용)
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState(null);

  // 장소 정보 모달 열림 여부
  const [modalOpen, setModalOpen] = useState(false);

  /* =====================================================
   * 2️⃣ DATA FETCH 영역
   * -----------------------------------------------------
   * - “서버에서 가져오는 데이터”
   * - App이 처음 마운트될 때 1회 실행
   * ===================================================== */

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await fetch("http://localhost:3000/places");
        const data = await res.json();
        setSavedPlaces(data);
      } catch (error) {
        console.error("장소 불러오기 실패:", error);
      }
    };

    fetchPlaces();
  }, []);

  /* =====================================================
   * 3️⃣ HOOKS 조합 영역
   * -----------------------------------------------------
   * - 각각의 hook은 “하나의 책임”만 가짐
   * - App에서는 이들을 조합해서 전체 동작을 만듦
   * ===================================================== */

  // 브라우저 알림 권한 요청 (앱 최초 진입 시)
  useNotificationPermission();

  // 현재 사용자 위치 추적 (mapInstance가 준비되면 동작)
  const currentPosition = useGeolocation(mapInstance);

  // placeId → Place Details 조회 로직
  const fetchPlaceDetails = usePlaceDetails(
    mapInstance,
    setSelectedPlacePosition,
    setSelectedPlaceInfo,
    setModalOpen
  );

  // 지도 클릭 시 실행될 핸들러 생성
  const handleMapClick = useMapClick(fetchPlaceDetails);

  // 현재 위치 기준으로 저장된 장소 근접 시 알림
  useProximityAlert({
    currentPosition,
    savedPlaces,
    notifiedPlaces,
    setNotifiedPlaces,
    radius: 100, // meters
  });

  /* =====================================================
   * 4️⃣ EVENT / HANDLER 영역
   * -----------------------------------------------------
   * - UI에서 발생한 이벤트를 “의미 있는 동작”으로 변환
   * ===================================================== */

  // 지도 로드 완료 시 map 인스턴스 저장
  const handleOnLoad = (map) => {
    setMapInstance(map);
  };

  // 검색 결과(Autocomplete)에서 장소 선택 시
  const handlePlaceSelect = (prediction) => {
    if (!prediction.place_id) return;
    fetchPlaceDetails(prediction.place_id);
  };

  // 장소 저장 버튼 클릭 시
  const handleSavePlace = async (placeData) => {
    try {
      const res = await fetch("/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(placeData),
      });

      const saved = await res.json();
      setSavedPlaces((prev) => [...prev, saved]);
      setModalOpen(false);
    } catch (error) {
      console.error("장소 저장 실패:", error);
    }
  };

  /* =====================================================
   * 5️⃣ RENDER (컴포넌트 조립)
   * -----------------------------------------------------
   * - 여기에는 “무엇을 보여줄지”만 있음
   * - 로직은 위에서 이미 다 결정됨
   * ===================================================== */

  return (
    <GoogleMapsProvider>
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        {/* 검색바 */}
        <SearchBar
          onPlaceSelect={handlePlaceSelect}
          currentPosition={currentPosition}
        />

        {/* 지도 */}
        <MapContainer
          currentLocation={currentPosition}
          selectedPlacePosition={selectedPlacePosition}
          savedPlaces={savedPlaces}
          onMapLoad={handleOnLoad}
          onMapClick={handleMapClick}
        />

        {/* 내 위치로 이동 버튼 */}
        <RecenterButton
          mapInstance={mapInstance}
          currentPosition={currentPosition}
        />

        {/* 장소 정보 모달 */}
        {modalOpen && (
          <BasicInfoModal
            place={selectedPlaceInfo}
            onClose={() => setModalOpen(false)}
            onSave={handleSavePlace}
          />
        )}
      </div>
    </GoogleMapsProvider>
  );
}

export default App;
