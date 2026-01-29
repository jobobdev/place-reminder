/* =========================================================
 * frontend/src/App.jsx
 * ========================================================= */

import PlaceBottomSheet from "./components/bottomSheet/PlaceBottomSheet.jsx";
import MapContainer from "./components/MapContainer.jsx";
import SearchBar from "./components/Searchbar.jsx";
import RecenterButton from "./components/RecenterButton.jsx";
import SavePlaceSheet from "./components/saveSheet/SavePlaceSheet.jsx";

/* ======================= Hooks ======================== */
import usePlaceMutations from "./hooks/usePlaceMutations.js";
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
  /* ======================= STATE ======================= */

  const [notifiedPlaces, setNotifiedPlaces] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);

  const [selectedPlaceSource, setSelectedPlaceSource] = useState(null);
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState(null);

  // Bottom Sheet 상태
  const [sheetState, setSheetState] = useState("hidden");

  // ✅ center 핵심 제어자: "user" | "place"
  const [centerOwner, setCenterOwner] = useState("place");

  // 🔥 지도 위치 제어 모드: "idle" | "recentered" | "follow"
  const [locationMode, setLocationMode] = useState("idle");

  const [activePin, setActivePin] = useState(null);
  /*
  activePin = {
    type: "saved" | "poi" | "user",
    id?: string,
    position: { lat, lng },
    state: "idle" | "highlighted" | "follow" | "alert"
  }
  */
  // SavePlaceSheet 제어
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);
  const API_BASE_URL = "http://localhost:3000";

  /* ======================= FETCH ======================= */

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/places`);
        const data = await res.json();
        setSavedPlaces(data);
      } catch (error) {
        console.error("장소 불러오기 실패:", error);
      }
    };
    fetchPlaces();
  }, [API_BASE_URL]);

  /* ======================= HOOKS ======================= */

  useNotificationPermission();
  const currentPosition = useGeolocation();

  /**
   * 🔥 장소 상세 로딩 성공 시:
   * - sheetState: partial
   * - locationMode: idle
   * - centerOwner: place (장소 탐색으로 간주)
   */
  const fetchPlaceDetails = usePlaceDetails(
    mapInstance,
    () => {},
    (placeInfo) => {
      setSelectedPlaceInfo(placeInfo);
      setSheetState("partial");

      // ✅ 장소 탐색 이벤트는 place가 centerOwner
      setCenterOwner("place");

      // ✅ 장소 탐색 시 follow 종료/초기화
      setLocationMode("idle");

      // ✅ POI 강조는 activePin 하나로 통일
      setActivePin({
        type: "poi",
        id: placeInfo.place_id,
        position: placeInfo.position,
        state: "highlighted",
      });
    }
  );

  const handleMapClick = useMapClick(fetchPlaceDetails, setSelectedPlaceSource);

  useProximityAlert({
    currentPosition,
    savedPlaces,
    notifiedPlaces,
    setNotifiedPlaces,
    radius: 100,
  });

  /* ======================= MUTATIONS ======================= */

  const { createPlace, updatePlace, deletePlace } = usePlaceMutations({
    API_BASE_URL,
    setSavedPlaces,
    setSelectedPlaceInfo,
    setSheetState,
  });

  /* ======================= EVENTS ======================= */

  const handleOnLoad = (map) => {
    console.log("[App] Map loaded -> setMapInstance", !!map);
    setMapInstance(map);
  };

  const handlePlaceSelect = (prediction) => {
    if (!prediction?.place_id) return;

    setSelectedPlaceSource("search");

    // ✅ 장소 탐색 이벤트
    setCenterOwner("place");
    setLocationMode("idle");

    // ✅ 기존 핀을 잠시 제거(로딩 중 잔존 핀 방지)
    setActivePin(null);

    fetchPlaceDetails(prediction.place_id);
  };

  const handleSavedPlaceClick = (place) => {
    setSelectedPlaceSource("saved");

    setSelectedPlaceInfo({
      ...place,
      type: "saved",
      memo: place.memo || { text: "", tag: "before" },
    });

    setSheetState("partial");

    // ✅ 저장 장소 클릭도 "장소 탐색"으로 간주
    setCenterOwner("place");
    setLocationMode("idle");

    // ✅ 저장 강조도 activePin 하나로 통일
    setActivePin({
      type: "saved",
      id: place._id,
      position: place.position,
      state: "highlighted",
    });
  };

  /* ======================= DERIVED ======================= */

  const isSaved = selectedPlaceInfo?.type === "saved";

  /* ======================= RENDER ======================= */

  return (
    <GoogleMapsProvider>
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <SearchBar
          onPlaceSelect={handlePlaceSelect}
          currentPosition={currentPosition}
        />

        <MapContainer
          currentLocation={currentPosition}
          savedPlaces={savedPlaces}
          onMapLoad={handleOnLoad}
          onMapClick={handleMapClick}
          onSavedPlaceClick={handleSavedPlaceClick}
          sheetState={sheetState}
          setSheetState={setSheetState}
          locationMode={locationMode}
          setLocationMode={setLocationMode}
          centerOwner={centerOwner}
          setCenterOwner={setCenterOwner}
          activePin={activePin} // ✅ activePin 전달
        />

        <RecenterButton
          mapInstance={mapInstance}
          currentPosition={currentPosition}
          sheetState={sheetState}
          locationMode={locationMode}
          setLocationMode={setLocationMode}
          setCenterOwner={setCenterOwner}
        />

        <PlaceBottomSheet
          key={
            selectedPlaceInfo?._id ?? selectedPlaceInfo?.place_id ?? "no-place"
          }
          place={selectedPlaceInfo}
          sheetState={sheetState}
          setSheetState={(state) => {
            setSheetState(state);

            // ✅ BottomSheet가 열리면: follow 종료  장소 탐색 상태로 복귀
            if (state !== "hidden") {
              setCenterOwner("place");
              setLocationMode("idle");
            }
          }}
          isSaved={isSaved}
          onOpenSaveSheet={() => {
            setIsSaveSheetOpen(true);
            setSheetState("hidden"); // 정보 시트는 내려놓음
          }}
          onToggleVisited={async () => {
            if (!selectedPlaceInfo?._id) return;

            const nextVisited = !selectedPlaceInfo.visited;
            const patchPayload = {
              visited: nextVisited,
              memo: {
                ...(selectedPlaceInfo.memo ?? {}),
                tag: nextVisited ? "after" : "before",
              },
            };

            // 🔥 방문 완료 시 → 알림 자동 OFF
            if (nextVisited === true) {
              patchPayload.alertEnabled = false;
            }

            const updated = await updatePlace(
              selectedPlaceInfo._id,
              patchPayload
            );

            setSelectedPlaceInfo({ ...updated, type: "saved" });
          }}
          onToggleAlert={async () => {
            // 1️⃣ 이미 저장된 장소
            if (selectedPlaceInfo?._id) {
              const updated = await updatePlace(selectedPlaceInfo._id, {
                alertEnabled: !selectedPlaceInfo.alertEnabled,
              });

              setSelectedPlaceInfo({ ...updated, type: "saved" });
              return;
            }

            // 2️⃣ 비저장 장소 → 자동 저장 & 알림 ON
            const saved = await createPlace({
              name: selectedPlaceInfo.name,
              address: selectedPlaceInfo.address,
              rating: selectedPlaceInfo.rating,
              reviews: selectedPlaceInfo.reviews,
              hours: selectedPlaceInfo.hours,
              position: selectedPlaceInfo.position,
              memo: { text: "", tag: "before" },
              myRating: null,
              alertEnabled: true,
            });

            setSelectedPlaceInfo({ ...saved, type: "saved" });
          }}
          // ✅ mutations 이후 activePin도 함께 정합성 유지
          onCreate={async (placePayload) => {
            const saved = await createPlace(placePayload);
            if (saved?.position && saved?._id) {
              setActivePin({
                type: "saved",
                id: saved._id,
                position: saved.position,
                state: "highlighted",
              });
            }
            return saved;
          }}
          onUpdate={async (placeId, payload) => {
            const updated = await updatePlace(placeId, payload);
            setSelectedPlaceInfo({
              ...updated,
              type: "saved",
            });
            return updated;
          }}
          onDelete={async (placeId) => {
            const ok = await deletePlace(placeId);
            setActivePin(null);
            return ok;
          }}
          onClose={() => {
            setSheetState("hidden");
            setActivePin(null); // ✅ 반드시 여기서 초기화
            setSelectedPlaceInfo(null);
          }}
        />
        <SavePlaceSheet
          isOpen={isSaveSheetOpen}
          place={selectedPlaceInfo}
          isSaved={isSaved}
          onCreate={createPlace}
          onUpdate={async (placeId, payload) => {
            const updated = await updatePlace(placeId, payload);
            setSelectedPlaceInfo({ ...updated, type: "saved" });
            return updated;
          }}
          onClose={() => {
            setIsSaveSheetOpen(false);

            // 저장 완료 후 정보 시트는 partial로 복귀
            setSheetState("partial");

            // pin 상태 유지
            if (selectedPlaceInfo?.position) {
              setActivePin({
                type: "saved",
                id: selectedPlaceInfo._id,
                position: selectedPlaceInfo.position,
                state: "highlighted",
              });
            }
          }}
          onDelete={async (placeId) => {
            await deletePlace(placeId);

            // UI 정리
            setIsSaveSheetOpen(false);
            setSheetState("hidden");
            setSelectedPlaceInfo(null);
            setActivePin(null);
          }}
        />
      </div>
    </GoogleMapsProvider>
  );
}

export default App;
