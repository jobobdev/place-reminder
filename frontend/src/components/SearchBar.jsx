// --------------------------------------------------
/*SearchBar.jsx
├─ useRef
│  ├─ sessionTokenRef
│  └─ placesServiceRef
│
├─ handleInput
│  ├─ Google API 체크 (1번만)
│  ├─ PlacesService 생성 (1회)
│  ├─ Text Search 요청
│  └─ 콘솔 출력
│
├─ enrichWithDistance (그대로 보존)
│
└─ render
   ├─ input
   ├─ results slice
   └─ 더보기 버튼 */
// --------------------------------------------------
// 역할:
// - Google Places Text Search를 이용한 장소 검색
// - 검색 결과를 "현재 위치 기준 거리순"으로 정렬 (기존 로직 보존)
// - 사용자가 결과를 클릭하면 부모(App)에 선택 이벤트 전달
// --------------------------------------------------

import { useState, useRef } from "react";
import { getDistanceFromLatLonInM } from "../utils/distance";
import SearchResultPanel from "../components/SearchResultPanel";
import SearchIcon from "@mui/icons-material/Search";

/*
  💡 이 컴포넌트는 "검색 UX"만 책임진다.
  - 지도 이동 ❌
  - 장소 상세 조회 ❌
  - 저장 로직 ❌
  → 오직 검색 + 결과 리스트 + 선택 이벤트만
*/
function SearchBar({ onPlaceSelect, currentPosition }) {
  // ==================================================
  // 1️⃣ STATE
  // ==================================================
  // Autocomplete 세션 토큰 (렌더링 간 유지)
  const sessionTokenRef = useRef(null);
  // PlacesService 인스턴스 (렌더링 간 유지)
  const placesServiceRef = useRef(null);

  // 사용자가 입력한 검색어
  const [query, setQuery] = useState("");
  // 자동완성 결과 리스트
  const [results, setResults] = useState([]);
  // 화면에 보여줄 결과 개수 / pagination 더보기용
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // 한 번에 몇 개씩 보여줄지 (상수)
  const PAGE_SIZE = 5;

  // ==================================================
  // 2️⃣ Google Maps API 로드 여부 확인
  // ==================================================
  // 브라우저에 Google Maps JS API가 완전히 로드되었는지 체크

  // AutocompleteService와 SessionToken은
  // Google API가 로드된 이후에만 생성 가능

  // ==================================================
  // 3️⃣ 검색 결과에 "거리 정보"를 추가하는 함수
  // ==================================================
  /*
    왜 필요한가?
    - Autocomplete 결과에는 좌표(lat/lng)가 없음
    - place_id만 제공됨
    - 거리 계산을 위해 Places Details API를 추가 호출해야 함

    전략:
    1) 상위 N개(predictions.slice)
    2) place_id → geometry.location 조회
    3) 현재 위치와 거리 계산
    4) distance 기준 정렬
  */

  const enrichWithDistance = async (predictions) => {
    // 현재 위치가 없으면 정렬 없이 그대로 반환
    if (!currentPosition) return predictions;

    // PlacesService는 지도 인스턴스가 없어도 사용 가능
    const placesService = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );

    // ✅ [여기가 유일한 개수 제한 위치]
    // 이유: Places Details API 호출 quota 보호용
    const MAX_DETAIL_CALLS = 20;
    const limitedPredictions = predictions.slice(0, MAX_DETAIL_CALLS);

    const enrichedResults = await Promise.all(
      limitedPredictions.map((prediction) => {
        const location = prediction?.geometry?.location;
        if (location) {
          const lat =
            typeof location.lat === "function" ? location.lat() : location.lat;
          const lng =
            typeof location.lng === "function" ? location.lng() : location.lng;
          if (typeof lat === "number" && typeof lng === "number") {
            const distance = getDistanceFromLatLonInM(
              currentPosition.lat,
              currentPosition.lng,
              lat,
              lng,
            );
            return Promise.resolve({
              ...prediction,
              distance,
            });
          }
        }

        return new Promise((resolve) => {
          placesService.getDetails(
            {
              placeId: prediction.place_id,
              fields: ["geometry"],
            },
            (place, status) => {
              if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
                return resolve(null);
              }

              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();

              const distance = getDistanceFromLatLonInM(
                currentPosition.lat,
                currentPosition.lng,
                lat,
                lng,
              );

              resolve({
                ...prediction,
                distance,
              });
            },
          );
        });
      }),
    );

    console.log(enrichedResults.map((r) => r && Math.round(r.distance)));

    // null 제거 + 거리순 정렬
    const MAX_DISTANCE = 10000; // 10km 이내만 허용(테스트용)
    return enrichedResults
      .filter(Boolean)
      .filter((item) => item.distance <= MAX_DISTANCE) // 거리 하드 컷
      .sort((a, b) => a.distance - b.distance);
  };

  // ==================================================
  // 4️⃣ 검색 입력 핸들러
  // ==================================================
  const handleInput = (e) => {
    console.log("⌨️ input fired", e.target.value);

    // ===============================
    // 🔹 A. 입력값 먼저 처리
    // ===============================
    const value = e.target.value;
    setQuery(value);

    // 🔥 [수정 ①] 검색 종료 조건 (여기가 핵심)
    // - 검색어가 지워지면
    // - 즉시 검색 상태 종료 + 결과 제거
    if (value.length < 1) {
      setResults([]); // 결과 패널 제거
      setIsLoading(false);
      return; // ❗ 여기서 함수 종료
    }

    // ===============================
    // 🔹 B. Google API 준비 체크
    // ===============================
    if (!window.google?.maps?.places) {
      console.warn("Google Maps API not ready yet");
      setIsLoading(false);
      return;
    }

    // ===============================
    // 🔹 C. PlacesService 최초 1회 생성
    // ===============================
    if (!placesServiceRef.current) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement("div"),
      );
    }

    // text search에서는 sessionToken 사용하지 않음 → ref만 초기화
    sessionTokenRef.current = null;

    const request = {
      query: value,
      radius: 5000,
    };

    if (currentPosition) {
      request.location = new window.google.maps.LatLng(
        currentPosition.lat,
        currentPosition.lng,
      );
    }

    setIsLoading(true);
    placesServiceRef.current.textSearch(request, async (places, status) => {
      console.log("🔍 textSearch status:", status);
      console.log("🔍 textSearch results:", places);
      console.log("🔍 textSearch count:", places?.length ?? 0);

      if (
        status !== window.google.maps.places.PlacesServiceStatus.OK ||
        !places
      ) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // 🔥 핵심 1: 거리 정보 추가 + 정렬
      const sortedResults = await enrichWithDistance(places);
      console.log("🔍 filtered count:", sortedResults.length);

      // 🔥 핵심 2: 결과 state에 저장
      setResults(sortedResults);

      // 🔥 핵심 3: pagination 초기화
      setVisibleCount(PAGE_SIZE);
      setIsLoading(false);
    });
  };

  // ==================================================
  // 🔁 무한스크롤 핸들러
  // ==================================================
  const handleReachEnd = () => {
    // 이미 모든 결과를 보여줬다면 중단
    if (visibleCount >= results.length) return;

    setVisibleCount((prev) => prev + PAGE_SIZE);
  };
  const isSearching = query.length >= 1;

  // ==================================================
  // 5️⃣ 렌더링
  // ==================================================
  // Google Maps API가 아직 로드되지 않았으면 아무것도 렌더링하지 않음
  const isMobile = window.innerWidth <= 768;

  return (
    <>
      {/* =========================================
        1️⃣ 배경 overlay (input 뒤)
        - 추가
        - input과 DOM 분리
       ========================================= */}
      {isMobile && isSearching && <div className="search-overlay" />}
      {/* 2) ✅ 헤더 컨테이너: 검색창 + (검색 중) 불투명 배경 */}
      <div
        className={`search-header ${isSearching ? "is-searching" : "is-not-searhcing"}`}
      >
        {isSearching && (
          <button
            style={styles.backButton}
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            type="button"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}
        {isSearching == false && (
          <div style={styles.searchIcon}>
            <SearchIcon />
          </div>
        )}

        <input
          style={{
            ...styles.input,
          }}
          value={query}
          onChange={handleInput}
          placeholder="장소를 검색하세요"
        />
      </div>
      {/* 3) 결과 패널 */}
      {isSearching && (
        <SearchResultPanel
          results={results}
          visibleCount={visibleCount}
          isMobile={isMobile}
          isSearching={isSearching}
          isLoading={isLoading}
          onReachEnd={handleReachEnd}
          offsetTop={0} // ✅ top controls(64) + height(64)
          onSelect={(item) => {
            onPlaceSelect(item);
            setResults([]);
            setQuery("");
          }}
        />
      )}
    </>
  );
}

// ==================================================
// 6️⃣ 스타일 (UI 전용)
// ==================================================
const styles = {
  input: {
    width: "100%",
    boxSizing: "border-box",
    paddingLeft: "40px",
    paddingRight: "40px",
    paddingTop: "12px",
    paddingBottom: "12px",
    borderRadius: "100px",
    border: "none",
    fontSize: "16px",
    boxShadow:
      "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px",
  },
  backButton: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 31,
    color: "#333", // 아이콘 색상
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 31,
    color: "#333", // 아이콘 색상
  },
};

export default SearchBar;
