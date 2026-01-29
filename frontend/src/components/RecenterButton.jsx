/**
 * RecenterButton.jsx
 *
 * 역할:
 * - locationMode 상태 기반으로 지도 동작 제어
 *
 * 정책:
 * - idle  → 클릭 시: 현재 위치로 1회 pan + follow 진입
 * - follow → 클릭 시: idle 전환 + 현재 위치로 1회 pan
 */

import recenterIcon from "../assets/icons/recenter_button.svg";

export default function RecenterButton({
  mapInstance,
  currentPosition,
  sheetState = "hidden",
  setLocationMode,
  setCenterOwner,
}) {
  // 위치 정보 없으면 렌더링 안 함
  if (!currentPosition) return null;

  const handleClick = () => {
    if (!mapInstance) return;

    // 항상 클릭 시 현재 위치로 1회 이동
    mapInstance.panTo(currentPosition);

    setCenterOwner?.("user"); // Map 조작 주체를 사용자로 설정
    // ✅ 상태 전이: idle → recentered → follow
    setLocationMode?.((prev) => {
      if (prev === "idle") return "recentered";
      if (prev === "recentered") return "follow";
      // follow 상태에서 버튼 클릭 시에는 정책이 명시되지 않았으므로,
      // 일반적인 UX(추적 종료)로 idle 복귀 처리
      return "idle";
    });
  };

  // BottomSheet 열리면 버튼은 시각적으로 뒤로 숨김
  const isSheetVisible = sheetState !== "hidden";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="내 위치로 이동"
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        zIndex: isSheetVisible ? 5 : 50,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "none",
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={recenterIcon}
        alt=""
        style={{ width: 22, height: 22, pointerEvents: "none" }}
      />
    </button>
  );
}
