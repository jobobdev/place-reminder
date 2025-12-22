// components/SearchResultPanel.jsx
import { useEffect, useRef } from "react";
import "../styles/searchResultPanel.css";

export default function SearchResultPanel({
  results,
  visibleCount,
  onSelect,
  isMobile,
  offsetTop = 60, // 검색창 높이
  // 🔽 다음 단계에서 연결할 예정 (지금은 옵션)
  onReachEnd,
}) {
  // ✅ Hook은 조건 없이 항상 호출되어야 함
  const loadMoreRef = useRef(null);

  useEffect(() => {
    // 결과 없으면 observe 불필요하지만,
    // Hook 자체는 호출되어야 하므로 "내부에서"만 early return
    if (!results || results.length === 0) return;
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          // 🔥 다음 단계에서 여기서 visibleCount 증가를 트리거할 것
          if (typeof onReachEnd === "function") onReachEnd();
        }
      },
      {
        root: null, // viewport 기준
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [results, onReachEnd]);

  // ✅ Hook 선언 이후에 return null
  if (!results || results.length === 0) return null;

  const visibleResults = results.slice(0, visibleCount);

  return (
    <div
      className={`search-result-panel ${isMobile ? "is-mobile" : "is-desktop"}`}
      style={isMobile ? { top: offsetTop } : undefined}
    >
      <div className="search-result-content">
        {visibleResults.map((item) => (
          <div
            key={`${item.place_id}-${item.name}`}
            className="search-result-item"
            onClick={() => onSelect(item)}
          >
            <div className="search-result-title">{item.name}</div>

            {item.formatted_address && (
              <div className="search-result-address">
                {item.formatted_address}
              </div>
            )}
          </div>
        ))}

        {/* ✅ 무한스크롤 감지용 sentinel (맨 아래) */}
        <div ref={loadMoreRef} className="load-more-sentinel" />
      </div>
    </div>
  );
}
