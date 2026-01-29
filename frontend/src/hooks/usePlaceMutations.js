// frontend/src/hooks/usePlaceMutations.js

/**
 * ⭐ usePlaceMutations
 *
 * 역할:
 * - 장소 생성(POST)
 * - 장소 수정(PATCH)
 * - 장소 삭제(DELETE)
 *
 * 원칙:
 * - UI 컴포넌트는 fetch / API URL / HTTP method를 몰라야 한다
 * - App.jsx가 이 훅을 사용해 상태만 연결한다
 */

export default function usePlaceMutations({
  API_BASE_URL,
  setSavedPlaces,
  setSelectedPlaceInfo,
  setSheetState,
}) {
  /**
   * 1️⃣ 장소 생성
   */
  const createPlace = async (placePayload) => {
    const res = await fetch(`${API_BASE_URL}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placePayload),
    });

    if (!res.ok) throw new Error("장소 저장 실패");

    const saved = await res.json();

    setSavedPlaces((prev) => [...prev, saved]);
    setSelectedPlaceInfo({ ...saved, type: "saved" });
    setSheetState("partial");

    return saved;
  };

  /**
   * 2️⃣ 장소 수정
   */
  const updatePlace = async (placeId, patchData) => {
    if (!placeId) {
      throw new Error("updatePlace called without placeId");
    }

    const res = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchData),
    });

    if (!res.ok) throw new Error("장소 수정 실패");

    const updated = await res.json();

    setSavedPlaces((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p))
    );
    setSelectedPlaceInfo({ ...updated, type: "saved" });

    return updated;
  };

  /**
   * 3️⃣ 장소 삭제
   */
  const deletePlace = async (placeId) => {
    if (!placeId) return;

    const res = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("장소 삭제 실패");

    setSavedPlaces((prev) => prev.filter((p) => p._id !== placeId));
    setSelectedPlaceInfo(null);
    setSheetState("hidden");

    return true;
  };

  return { createPlace, updatePlace, deletePlace };
}
