// frontend/src/components/MapContainer.jsx

import { GoogleMap, Marker, Polygon } from "@react-google-maps/api";
import { useEffect, useMemo, useRef } from "react";

import { getPinVariant } from "./map/pinVariants";
import { PIN_ICONS } from "./map/pinIcons";

// ✅ 렌더마다 객체가 새로 생성되지 않도록 컴포넌트 밖으로 고정
const INITIAL_CENTER = { lat: 37.5665, lng: 126.978 };

export default function MapContainer({
  currentLocation,
  savedPlaces,
  onMapLoad,
  onMapClick,
  onSavedPlaceClick,
  sheetState,
  setSheetState,
  locationMode,
  setLocationMode,
  centerOwner,
  setCenterOwner,
  activePin,
}) {
  const mapRef = useRef(null);

  // 초기 위치로 1회만 pan 하기 위한 가드
  const hasPannedToInitialRef = useRef(false);

  // mode 전이(예: follow → idle)에서 "1회 pan" 같은 동작을 위해 prev 저장
  const prevLocationModeRef = useRef(locationMode);

  // ✅ Follow 모드 미지원 환경 안내 (1회만)
  const hasShownFollowUnsupportedToastRef = useRef(false);

  // Google Maps 로드 여부 (아이콘 빌드 시 안전장치)
  const hasGoogleMaps = !!window.google?.maps;

  /**
   * ✅ 최신 상태를 ref로 보관
   * - "activePin 선택 변화(id 변화) 때만 pan" 하되,
   *   locationMode/centerOwner가 바뀌었다고 effect가 재실행되면 안 됨.
   * - eslint exhaustive-deps 경고 없이도 최신 값을 참조하기 위해 ref 사용.
   */
  const activePinRef = useRef(activePin);
  const latestStateRef = useRef({ centerOwner, locationMode });

  useEffect(() => {
    activePinRef.current = activePin;
  }, [activePin]);

  useEffect(() => {
    latestStateRef.current = { centerOwner, locationMode };
  }, [centerOwner, locationMode]);

  /**
   * Google Maps Marker icon object 생성 유틸
   * - pinVariants에서 내려준 spec을 기반으로 안전하게 icon object 생성
   */
  const buildIconFromSpec = (spec) => {
    if (!spec) return undefined;
    if (!hasGoogleMaps) return undefined;

    const url = PIN_ICONS?.[spec.icon];
    if (!url) return undefined;

    const size = typeof spec.size === "number" ? spec.size : 28;
    const anchorArr = Array.isArray(spec.anchor)
      ? spec.anchor
      : [size / 2, size];

    return {
      url,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(anchorArr[0], anchorArr[1]),
    };
  };

  /* ---------------------------------------------
   * Heading Cone 계산 (state ❌, 순수 계산)
   * --------------------------------------------- */
  const getHeadingConePath = () => {
    if (locationMode !== "follow") return null;
    if (!currentLocation || typeof currentLocation.heading !== "number")
      return null;

    const spherical = window.google?.maps?.geometry?.spherical;
    if (!spherical) return null;

    const center = new window.google.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng
    );

    const heading = currentLocation.heading;
    const halfAngle = 30;
    const radiusM = 60;

    const points = [center];
    for (let a = heading - halfAngle; a <= heading + halfAngle; a += 5) {
      points.push(spherical.computeOffset(center, radiusM, a));
    }
    points.push(center);

    return points;
  };

  const headingConePath = getHeadingConePath();

  /* ---------------------------------------------
   * 1️⃣ sheetState에 따른 지도 옵션 제어
   * --------------------------------------------- */
  useEffect(() => {
    if (!mapRef.current) return;

    const isBlocked = sheetState === "full";

    mapRef.current.setOptions({
      draggable: !isBlocked,
      scrollwheel: !isBlocked,
      disableDoubleClickZoom: isBlocked,
      gestureHandling: isBlocked ? "none" : "greedy",
      zoomControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
    });
  }, [sheetState]);

  /* ---------------------------------------------
   * 2️⃣ 초기 진입 시 현재 위치로 1회만 pan
   * --------------------------------------------- */
  useEffect(() => {
    if (!mapRef.current) return;
    if (hasPannedToInitialRef.current) return;
    if (!currentLocation) return;

    hasPannedToInitialRef.current = true;
    mapRef.current.panTo(currentLocation);
  }, [currentLocation]);

  /* ---------------------------------------------
   * 3️⃣ centerOwner === "user"일 때의 동작
   * --------------------------------------------- */
  useEffect(() => {
    if (!mapRef.current) return;
    if (centerOwner !== "user") return;
    if (!currentLocation) return;

    const prev = prevLocationModeRef.current;
    const next = locationMode;
    prevLocationModeRef.current = next;

    // ✅ recentered 진입: 1회 pan
    if (next === "recentered") {
      mapRef.current.panTo(currentLocation);
      return;
    }

    // ✅ follow → idle 전이: 1회 pan
    if (prev === "follow" && next === "idle") {
      mapRef.current.panTo(currentLocation);
      return;
    }
  }, [centerOwner, locationMode, currentLocation]);

  /* ---------------------------------------------
   * 4️⃣ follow 모드: 내 위치 추적
   * --------------------------------------------- */
  useEffect(() => {
    if (!mapRef.current) return;
    if (centerOwner !== "user") return;
    if (locationMode !== "follow") return;
    if (!currentLocation) return;

    // 🔴 heading 미지원 환경
    if (typeof currentLocation.heading !== "number") {
      if (!hasShownFollowUnsupportedToastRef.current) {
        hasShownFollowUnsupportedToastRef.current = true;
        window.alert("위치 추적 모드는 모바일 환경에서만 지원됩니다.");
      }
      return;
    }

    mapRef.current.panTo(currentLocation);

    mapRef.current.setHeading?.(currentLocation.heading);
    mapRef.current.setTilt?.(45);
  }, [centerOwner, locationMode, currentLocation]);

  /* ---------------------------------------------
   * 5️⃣ activePin 변경 시 pan (선택 변화에만 반응)
   *
   * 의도:
   * - activePin "선택 변화(id 변화)" 시에만 pan
   * - locationMode / centerOwner 변화로는 재실행 금지
   *
   * 구현:
   * - dependency는 activePin.id만 둔다.
   * - 단, 최신 activePin.position / centerOwner / locationMode는 ref에서 읽는다.
   * --------------------------------------------- */
  useEffect(() => {
    const pin = activePinRef.current;
    if (!mapRef.current || !pin?.position) return;

    const { centerOwner: latestCenterOwner, locationMode: latestLocationMode } =
      latestStateRef.current;

    // follow 중이면 activePin이 바뀌어도 즉시 pan 하지 않음
    if (latestLocationMode === "follow") return;

    // "user" 중심일 때는 activePin pan 금지
    if (latestCenterOwner !== "place") return;

    mapRef.current.panTo(pin.position);
  }, [activePin?.id]);

  /* ======================= PIN SPECS ======================= */

  /**
   * ✅ activePin 스펙
   * - activePin은 "딱 1개"만 렌더
   * - saved/poi 모두 동일한 방식으로 spec 결정
   */
  const activeSpec = useMemo(() => {
    if (!activePin?.type) return null;

    const isActiveHidden =
      activePin?.type === "saved" &&
      activePin?.visited &&
      activePin?.hiddenAfterVisited;
    if (isActiveHidden) return null;

    if (activePin.type === "saved") {
      return getPinVariant({
        type: "saved",
        state: activePin.state,
        visited: !!activePin.visited,
        highlighted: true,
      });
    }

    if (activePin.type === "poi") {
      return getPinVariant({
        type: "poi",
        state: activePin.state,
        highlighted: true,
      });
    }

    // current는 activePin으로 쓰지 않는 전제(현재 위치는 별도 렌더)
    return null;
  }, [activePin]);

  const activeIcon = buildIconFromSpec(activeSpec);

  /**
   * ✅ savedPlaces 기본(Idle) 스펙
   * - 저장 장소는 기본적으로 idle로 깔리고
   * - activePin이 saved인 경우 그 id만 리스트에서 제외하여 "중복 렌더"를 방지한다.
   */
  const savedIdleSpec = useMemo(() => {
    return getPinVariant({
      type: "saved",
      state: "idle",
      visited: false,
      highlighted: false,
    });
  }, []);

  const savedVisitedIdleSpec = useMemo(() => {
    return getPinVariant({
      type: "saved",
      state: "idle",
      visited: true,
      highlighted: false,
    });
  }, []);

  const savedIdleIcon = buildIconFromSpec(savedIdleSpec);
  const savedVisitedIdleIcon = buildIconFromSpec(savedVisitedIdleSpec);

  const isHiddenAfterVisited = (place) =>
    !!(place?.visited && place?.hiddenAfterVisited);

  const isActiveHidden =
    activePin?.type === "saved" &&
    activePin?.visited &&
    activePin?.hiddenAfterVisited;

  /* ======================= RENDER ======================= */

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={INITIAL_CENTER}
      zoom={14}
      onLoad={(map) => {
        mapRef.current = map;
        if (onMapLoad) onMapLoad(map);

        // ✅ map이 늦게 로드되는 케이스 대비: 여기서도 1회 pan 보장
        if (!hasPannedToInitialRef.current && currentLocation) {
          hasPannedToInitialRef.current = true;
          map.panTo(currentLocation);
        }
      }}
      onDragStart={() => {
        // 사용자 조작 = follow 종료 + 장소 탐색 상태로
        setLocationMode?.("idle");
        setCenterOwner?.("place");

        // ✅ 4-2 규칙: BottomSheet 열린 상태에서 드래그하면 "hidden"이 아니라 "peek"
        if (sheetState !== "hidden") {
          setSheetState?.("peek");
        }
      }}
      onZoomChanged={() => {
        setLocationMode?.("idle");
        setCenterOwner?.("place");

        // ✅ 4-2 규칙: BottomSheet 열린 상태에서 줌 변경 시에도 peek
        if (sheetState !== "hidden") {
          setSheetState?.("peek");
        }
      }}
      onClick={(e) => {
        // 지도 클릭/POI 선택도 사용자 조작으로 간주 → follow 종료
        setLocationMode?.("idle");
        setCenterOwner?.("place");

        // ✅ 4-2 규칙: BottomSheet가 열려있으면 "닫기(hidden)"가 아니라 "peek"
        if (sheetState !== "hidden") {
          setSheetState?.("peek");
        }

        onMapClick?.(e);
      }}
      options={{
        clickableIcons: true,
        gestureHandling: "greedy",
        disableDoubleClickZoom: false,
        zoomControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        cameraControl: false,
      }}
    >
      {/* ================= Overlay ================= */}

      {/* Follow 모드 방향 부채꼴 */}
      {headingConePath && (
        <Polygon
          paths={headingConePath}
          options={{
            strokeOpacity: 0,
            fillColor: "#1a73e8",
            fillOpacity: 0.18,
            clickable: false,
            zIndex: 1,
          }}
        />
      )}

      {/* ================= Pins ================= */}

      {/* 현재 위치 (항상 1개) */}
      {currentLocation && (
        <Marker
          position={currentLocation}
          icon={
            hasGoogleMaps
              ? {
                  url: PIN_ICONS.current,
                  scaledSize: new window.google.maps.Size(16, 16),
                  anchor: new window.google.maps.Point(8, 16),
                }
              : undefined
          }
          zIndex={4}
        />
      )}

      {/* 저장된 장소(일반) */}
      {savedPlaces
        .filter((place) => !isHiddenAfterVisited(place))
        .filter(
          (place) =>
            !(activePin?.type === "saved" && activePin?.id === place._id)
        )
        .map((place) => {
          const isVisited = !!place.visited;
          const icon = isVisited ? savedVisitedIdleIcon : savedIdleIcon;
          const spec = isVisited ? savedVisitedIdleSpec : savedIdleSpec;

          return (
            <Marker
              key={place._id}
              position={place.position}
              icon={icon}
              zIndex={spec?.zIndex ?? 1}
              onClick={() => onSavedPlaceClick(place)}
            />
          );
        })}

      {/* activePin (POI 또는 saved) - 딱 1개만 */}
      {activePin?.position && !isActiveHidden && (
        <Marker
          key={`active-${activePin.type}-${activePin.id ?? "noid"}`}
          position={activePin.position}
          icon={activeIcon}
          zIndex={activeSpec?.zIndex ?? 3}
        />
      )}
    </GoogleMap>
  );
}
