// --------------------------------------------------
/*SearchBar.jsx
├─ useRef
│  ├─ sessionTokenRef
│  └─ autocompleteServiceRef   ✅ 유일
│
├─ handleInput
│  ├─ Google API 체크 (1번만)
│  ├─ AutocompleteService 생성 (1회)
│  ├─ SessionToken 생성 (검색 시작 시)
│  └─ getPlacePredictions 호출
│
├─ enrichWithDistance (그대로 사용)
│
└─ render
   ├─ input
   ├─ results slice
   └─ 더보기 버튼 */
// --------------------------------------------------
// 역할:
// - Google Places Autocomplete를 이용한 장소 검색
// - 검색 결과를 "현재 위치 기준 거리순"으로 정렬
// - 사용자가 결과를 클릭하면 부모(App)에 선택 이벤트 전달
// --------------------------------------------------

import { useState, useRef } from "react";
import { getDistanceFromLatLonInM } from "../utils/distance";

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
  // AutocompleteService 인스턴스 (렌더링 간 유지)
  const autocompleteServiceRef = useRef(null);

  // 사용자가 입력한 검색어
  const [query, setQuery] = useState("");
  // 자동완성 결과 리스트
  const [results, setResults] = useState([]);
  // 화면에 보여줄 결과 개수 / pagination 더보기용
  const [visibleCount, setVisibleCount] = useState(5);

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
      document.createElement("div")
    );

    // ✅ [여기가 유일한 개수 제한 위치]
    // 이유: Places Details API 호출 quota 보호용
    const MAX_DETAIL_CALLS = 20;
    const limitedPredictions = predictions.slice(0, MAX_DETAIL_CALLS);

    const enrichedResults = await Promise.all(
      limitedPredictions.map(
        (prediction) =>
          new Promise((resolve) => {
            placesService.getDetails(
              {
                placeId: prediction.place_id,
                fields: ["geometry"],
              },
              (place, status) => {
                if (
                  status !== window.google.maps.places.PlacesServiceStatus.OK
                ) {
                  return resolve(null);
                }

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                const distance = getDistanceFromLatLonInM(
                  currentPosition.lat,
                  currentPosition.lng,
                  lat,
                  lng
                );

                resolve({
                  ...prediction,
                  distance,
                });
              }
            );
          })
      )
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
  const handleInput = async (e) => {
    console.log("⌨️ input fired", e.target.value);
    console.log("google:", window.google);
    console.log("maps:", window.google?.maps);
    console.log("places:", window.google?.maps?.places);

    // 1️⃣ Google Maps API 준비 여부 확인 (단 한 번만)
    if (!window.google?.maps?.places) {
      console.warn("Google Maps API not ready yet");
      return;
    }

    // 2️⃣ AutocompleteService 최초 1회 생성
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current =
        new window.google.maps.places.AutocompleteService();
    }

    const value = e.target.value;
    setQuery(value);

    // 3️⃣ 입력이 너무 짧으면 결과 초기화
    if (value.length < 2) {
      setResults([]);
      return;
    }

    // 4️⃣ 새 검색 시작 시 SessionToken 생성
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        new window.google.maps.places.AutocompleteSessionToken();
    }

    // 5️⃣ pagination 초기화
    setVisibleCount(PAGE_SIZE);

    // 6️⃣ Autocomplete 요청
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: value,
        sessionToken: sessionTokenRef.current,

        // 🔥 (1) 현재 위치
        location: currentPosition
          ? new window.google.maps.LatLng(
              currentPosition.lat,
              currentPosition.lng
            )
          : undefined,

        // 🔥 (2) 반경 제한 (미터)
        radius: 5000, // 5km

        // 🔥 (3) 국가 제한 (한국)
        componentRestrictions: { country: "kr" },
      },
      async (predictions, status) => {
        console.log("🔍 status:", status);
        console.log("🔍 predictions:", predictions);
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          const sortedResults = await enrichWithDistance(predictions);
          setResults(sortedResults);
        } else {
          setResults([]);
        }
      }
    );
  };

  // ==================================================
  // 5️⃣ 렌더링
  // ==================================================
  // Google Maps API가 아직 로드되지 않았으면 아무것도 렌더링하지 않음

  // 🔥 [STEP 3-3] 화면에 보여줄 결과만 잘라서 사용
  // - results: 전체 검색 결과
  // - visibleCount: 현재 화면에 보여줄 개수(예: 5개)
  const visibleResults = results.slice(0, visibleCount);

  return (
    <div style={styles.container}>
      {/* 검색 입력창 */}
      <input
        style={styles.input}
        value={query}
        onChange={handleInput}
        placeholder="장소를 검색하세요"
      />

      {/* 자동완성 결과 리스트 */}
      {visibleResults.length > 0 && (
        <div style={styles.resultBox}>
          {visibleResults.map((item) => (
            <div
              key={item.place_id}
              style={styles.item}
              onClick={() => {
                /*
                [검색 결과 클릭 시 동작 흐름]

                  1️⃣ 선택한 장소를 부모(App.jsx)로 전달
                    → 지도 이동, 모달 오픈은 App에서 처리

                  2️⃣ 자동완성 결과 리스트만 닫기
                    → query는 유지되므로
                      input에는 검색어가 그대로 남음
                */
                onPlaceSelect(item);
                setResults([]); // 🔥 리스트 닫기
              }}
            >
              {item.description}
            </div>
          ))}
        </div>
      )}

      {/* 더보기 버튼 */}
      {results.length > visibleCount && (
        <div style={styles.moreBox}>
          <button
            style={styles.moreButton}
            onClick={() => {
              /*
          [더보기 버튼 동작]
          - 현재 보여주는 개수 + PAGE_SIZE
          - 결과가 부족하면 자동으로 끝
        */
              setVisibleCount((prev) => prev + PAGE_SIZE);
            }}
          >
            더보기
          </button>
        </div>
      )}
    </div>
  );
}

// ==================================================
// 6️⃣ 스타일 (UI 전용)
// ==================================================
const styles = {
  container: {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    zIndex: 10,
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  resultBox: {
    marginTop: "4px",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  item: {
    padding: "10px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
  },
  moreBox: {
    padding: "8px",
    textAlign: "center",
    background: "#fafafa",
  },
  moreButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default SearchBar;
