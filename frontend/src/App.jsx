/* =========================================================
 * frontend/src/App.jsx
 * ========================================================= */

import { API_BASE_URL } from "./config/api";

import PlaceBottomSheet from "./components/bottomSheet/PlaceBottomSheet.jsx";
import MapContainer from "./components/MapContainer.jsx";
import RecenterButton from "./components/RecenterButton.jsx";
import SavePlaceSheet from "./components/saveSheet/SavePlaceSheet.jsx";
import closeIcon from "./assets/icons/bottomsheet_close_icon.svg";
import chevronLeftIcon from "./assets/icons/Chevron_left.svg";
import useSheetDrag from "./components/bottomSheet/useSheetDrag";
import TopControls from "./components/TopControls.jsx";

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
  void selectedPlaceSource;
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState(null);

  // Bottom Sheet 상태
  const [sheetState, setSheetState] = useState("hidden");

  // ✅ center 핵심 제어자: "user" | "place"
  const [centerOwner, setCenterOwner] = useState("place");

  // 🔥 지도 위치 제어 모드: "idle" | "recentered" | "follow"
  const [locationMode, setLocationMode] = useState("idle");

  const [activePin, setActivePin] = useState(null);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [myPageView, setMyPageView] = useState("main");
  const [myPageSheetState, setMyPageSheetState] = useState("hidden");
  const { dragHeight: myPageDragHeight, handlers: myPageHandlers } =
    useSheetDrag({
      sheetState: myPageSheetState,
      setSheetState: setMyPageSheetState,
    });
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
  }, []);

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
    },
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
      visited: place.visited ?? false,
      hiddenAfterVisited: place.hiddenAfterVisited ?? false,
    });
  };

  /* ======================= DERIVED ======================= */

  const isSaved = selectedPlaceInfo?.type === "saved";
  const hiddenPlaces = savedPlaces.filter((place) => place.hiddenAfterVisited);
  const visibleSavedPlaces = savedPlaces.filter(
    (place) => !place.hiddenAfterVisited,
  );
  const shouldHideTopControls =
    myPageSheetState === "full" || sheetState === "full" || isSaveSheetOpen;

  const closePlaceSheet = () => {
    setSheetState("hidden");
    setSelectedPlaceInfo(null);
    setActivePin(null);
  };

  const handleOpenMyPage = () => {
    closePlaceSheet();
    setMyPageView("main");
    setIsMyPageOpen(true);
    setMyPageSheetState("full");
  };

  /* ======================= RENDER ======================= */

  return (
    <GoogleMapsProvider>
      <div
        style={{
          width: "100vw",
          height: "100dvh",
          position: "relative",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <TopControls
          currentPosition={currentPosition}
          onPlaceSelect={handlePlaceSelect}
          onOpenMyPage={handleOpenMyPage}
          shouldHideTopControls={shouldHideTopControls}
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
          onToggleVisited={async (options) => {
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
              if (options?.keepAlert) {
                patchPayload.alertEnabled = true;
              } else {
                patchPayload.alertEnabled = false;
              }
            }

            const updated = await updatePlace(
              selectedPlaceInfo._id,
              patchPayload,
            );

            setSelectedPlaceInfo({ ...updated, type: "saved" });
            setActivePin((prev) => {
              if (!prev || prev.type !== "saved" || prev.id !== updated._id) {
                return prev;
              }
              return {
                ...prev,
                visited: updated.visited ?? false,
                hiddenAfterVisited: updated.hiddenAfterVisited ?? false,
              };
            });
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
                visited: saved.visited ?? false,
                hiddenAfterVisited: saved.hiddenAfterVisited ?? false,
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
            setActivePin((prev) => {
              if (!prev || prev.type !== "saved" || prev.id !== updated._id) {
                return prev;
              }
              return {
                ...prev,
                visited: updated.visited ?? false,
                hiddenAfterVisited: updated.hiddenAfterVisited ?? false,
              };
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
            if (
              selectedPlaceInfo?.position &&
              !(
                selectedPlaceInfo?.visited &&
                selectedPlaceInfo?.hiddenAfterVisited
              )
            ) {
              setActivePin({
                type: "saved",
                id: selectedPlaceInfo._id,
                position: selectedPlaceInfo.position,
                state: "highlighted",
                visited: selectedPlaceInfo.visited ?? false,
                hiddenAfterVisited:
                  selectedPlaceInfo.hiddenAfterVisited ?? false,
              });
            } else {
              setActivePin(null);
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
        {isMyPageOpen && (
          <div
            style={{
              ...myPageOverlayStyle,
              height: myPageDragHeight
                ? `${myPageDragHeight}px`
                : myPageHeightByState[myPageSheetState],
            }}
            {...myPageHandlers}
          >
            <div style={myPageHeaderStyle}>
              {myPageView !== "main" ? (
                <button
                  type="button"
                  style={myPageBackButtonStyle}
                  onClick={() => {
                    if (myPageSheetState === "peek") {
                      setMyPageSheetState("full");
                      return;
                    }
                    setMyPageView("main");
                  }}
                >
                  <img
                    src={chevronLeftIcon}
                    alt="back"
                    width={20}
                    height={20}
                  />
                </button>
              ) : (
                <div style={{ width: 24 }} />
              )}
              <div style={myPageTitleStyle}>
                {myPageView === "saved"
                  ? "저장된 장소"
                  : myPageView === "hidden"
                    ? "숨겨진 장소"
                    : "내 페이지"}
              </div>
              <button
                type="button"
                style={myPageCloseButtonStyle}
                onClick={() => {
                  setIsMyPageOpen(false);
                  setMyPageView("main");
                  setMyPageSheetState("hidden");
                }}
              >
                <img src={closeIcon} alt="close" width={32} height={32} />
              </button>
            </div>

            <div style={myPageContentStyle}>
              {myPageView === "main" && (
                <>
                  <button
                    type="button"
                    style={myPageRowStyle}
                    onClick={() => setMyPageView("saved")}
                  >
                    <span style={myPageRowTitleStyle}>저장된 장소</span>
                    <span style={myPageCountStyle}>
                      {visibleSavedPlaces.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    style={myPageRowStyle}
                    onClick={() => setMyPageView("hidden")}
                  >
                    <span style={myPageRowTitleStyle}>숨겨진 장소</span>
                    <span style={myPageCountStyle}>{hiddenPlaces.length}</span>
                  </button>
                </>
              )}

              {myPageView === "saved" && (
                <div style={myPageListStyle}>
                  {visibleSavedPlaces.length === 0 && (
                    <div style={myPageEmptyStyle}>저장된 장소가 없습니다.</div>
                  )}
                  {visibleSavedPlaces.map((place) => (
                    <div
                      key={place._id}
                      style={myPageListRowStyle}
                      onClick={() => {
                        if (!place?.position) return;
                        setMyPageSheetState("peek");
                        setCenterOwner("place");
                        setLocationMode("idle");
                        setActivePin({
                          type: "saved",
                          id: place._id,
                          position: place.position,
                          state: "highlighted",
                          visited: place.visited ?? false,
                          hiddenAfterVisited: place.hiddenAfterVisited ?? false,
                        });
                      }}
                    >
                      <div style={myPageListTextStyle}>
                        <div style={myPageListTitleStyle}>{place.name}</div>
                        {place.address && (
                          <div style={myPageListSubStyle}>{place.address}</div>
                        )}
                        {place.memo?.text && (
                          <div style={myPageListMemoStyle}>
                            {place.memo.text}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {myPageView === "hidden" && (
                <div style={myPageListStyle}>
                  {hiddenPlaces.length === 0 && (
                    <div style={myPageEmptyStyle}>숨겨진 장소가 없습니다.</div>
                  )}
                  {hiddenPlaces.map((place) => (
                    <div key={place._id} style={myPageListRowStyle}>
                      <div style={myPageListTextStyle}>
                        <div style={myPageListTitleStyle}>{place.name}</div>
                        {place.address && (
                          <div style={myPageListSubStyle}>{place.address}</div>
                        )}
                        {place.memo?.text && (
                          <div style={myPageListMemoStyle}>
                            {place.memo.text}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        style={myPageActionButtonStyle}
                        onClick={async () => {
                          if (!place._id) return;
                          await updatePlace(place._id, {
                            hiddenAfterVisited: false,
                          });
                        }}
                      >
                        숨김 해제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GoogleMapsProvider>
  );
}

export default App;

const myPageHeightByState = {
  peek: "120px",
  partial: "45vh",
  full: "100vh",
};

const myPageOverlayStyle = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2000,
  backgroundColor: "#fff",
  display: "flex",
  flexDirection: "column",
};

const myPageHeaderStyle = {
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px",
  borderBottom: "1px solid #eee",
};

const myPageTitleStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#222",
};

const myPageCloseButtonStyle = {
  padding: 0,
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
};

const myPageBackButtonStyle = {
  padding: 0,
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
};

const myPageContentStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
};

const myPageRowStyle = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "16px",
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#fff",
  cursor: "pointer",
};

const myPageRowTitleStyle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#222",
};

const myPageCountStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#1a73e8",
};

const myPageListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const myPageListRowStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "14px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const myPageListTextStyle = {
  flex: 1,
  minWidth: 0,
};

const myPageListTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#222",
  marginBottom: 4,
};

const myPageListSubStyle = {
  fontSize: 12,
  color: "#666",
};

const myPageListMemoStyle = {
  fontSize: 12,
  color: "#8b8b8b",
  marginTop: 6,
};

const myPageActionButtonStyle = {
  height: 24,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  backgroundColor: "#f8fafc",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const myPageEmptyStyle = {
  fontSize: 13,
  color: "#888",
  padding: "12px 4px",
};
