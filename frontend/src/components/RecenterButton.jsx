// src/components/RecenterButton.jsx

/**
 * 내 위치로 지도 중심 이동 버튼 컴포넌트
 *
 * props:
 * - mapInstance: Google Map 객체 (panTo 같은 메서드 사용 가능)
 * - currentPosition: { lat, lng } 현재 위치
 */
export default function RecenterButton({ mapInstance, currentPosition }) {
  const handleClick = () => {
    if (!mapInstance) {
      console.warn("지도 인스턴스가 아직 준비되지 않았습니다.");
      return;
    }
    if (!currentPosition) {
      console.warn("현재 위치 정보가 아직 없습니다.");
      return;
    }

    // panTo: 지도 중심을 부드럽게 해당 좌표로 이동
    mapInstance.panTo(currentPosition);
  };

  return (
    <button
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        padding: "10px 14px",
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
      }}
      onClick={handleClick}
    >
      📍 내 위치로 이동
    </button>
  );
}
