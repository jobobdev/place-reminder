// frontend/src/components/BasicInfoModal.jsx
import { useMemo, useState } from "react";
import styles from "./BasicInfoModalStyles.module.css";

function formatRating1(v) {
  if (v === null || v === undefined) return null;
  return Number(v).toFixed(1); // ✅ 소수 1자리
}

function BasicInfoModal({
  place,
  onClose,
  onSave,
  onUpdate,
  isSaved,
  onDelete,
}) {
  // ✅ Hooks는 항상 최상단에서 호출 (조건부 return보다 먼저)
  const hours = useMemo(
    () => (Array.isArray(place?.hours) ? place.hours : []),
    [place],
  );

  // 🔹 메모는 text + tag 구조
  const [memoText, setMemoText] = useState(place?.memo?.text || "");
  const [memoTag, setMemoTag] = useState(place?.memo?.tag || "before");

  const [myRating, setMyRating] = useState(
    place?.myRating === undefined ? null : place.myRating,
  );

  // ✅ place가 바뀔 때 입력값을 "리셋"해야 하면:
  // 가장 안전한 방법은 App.jsx에서 <BasicInfoModal key=... />로 이미 처리 중입니다.
  // 따라서 여기서 useEffect로 setState 동기 호출을 만들지 않습니다.

  if (!place) return null;
  // 🚨 방어 코드 1: 저장된 장소인데 _id가 없으면 즉시 중단
  if (isSaved && !place._id) {
    console.error("❌ 저장된 장소인데 _id가 없습니다.", place);
    return null;
  }

  const googleRatingText =
    place.rating != null ? formatRating1(place.rating) : "정보 없음";
  const myRatingText = myRating != null ? formatRating1(myRating) : "미입력";

  const handlePrimaryClick = () => {
    const memoPayload = {
      text: memoText,
      tag: memoTag,
    };

    if (isSaved) {
      // 🔄 저장된 장소 수정 (PATCH)
      if (typeof onUpdate === "function" && place._id) {
        onUpdate(place._id, {
          memo: memoPayload,
          myRating,
        });
      }
      return;
    }

    // ➕ 새 장소 저장 (POST)
    if (typeof onSave === "function") {
      onSave({
        ...place,
        memo: memoPayload,
        myRating,
      });
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.closeBtn} onClick={onClose}>
          ×
        </div>

        <h2 style={{ marginBottom: 6 }}>{place.name}</h2>

        {isSaved && <div className={styles.savedBadge}>저장된 장소</div>}

        {/* ✅ 표기 방식: 네이버 지도 느낌으로 "★ 4.5" */}
        <div style={{ marginTop: 10 }}>
          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>내 평점</span>
            <span className={styles.ratingValue}>★ {myRatingText}</span>
          </div>

          {/* ✅ 0.5 단위 선택 UI (10칸) */}
          <HalfStarPicker value={myRating} onChange={setMyRating} />
        </div>

        <div style={{ marginTop: 12 }}>
          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>Google 평점</span>
            <span className={styles.ratingValue}>★ {googleRatingText}</span>
          </div>
        </div>

        <p style={{ marginTop: 10 }}>
          <strong>주소:</strong> {place.address}
        </p>

        <p style={{ marginTop: 8 }}>
          <strong>운영 시간:</strong>
        </p>
        <ul>
          {hours.length > 0 ? (
            hours.map((line, idx) => <li key={idx}>{line}</li>)
          ) : (
            <li>영업시간 정보 없음</li>
          )}
        </ul>

        <textarea
          className={styles.textarea}
          placeholder="메모를 입력하세요 (선택)"
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
        />
        {/* 🔖 메모 태그 선택 */}
        <div className={styles.memoTag}>
          <button
            type="button"
            onClick={() => setMemoTag("before")}
            style={{
              flex: 1,
              padding: "4px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: memoTag === "before" ? "#007bff" : "#f5f5f5",
              color: memoTag === "before" ? "#fff" : "#333",
              fontWeight: 500,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            방문 전
          </button>

          <button
            type="button"
            onClick={() => setMemoTag("after")}
            style={{
              flex: 1,
              padding: "4px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: memoTag === "after" ? "#28a745" : "#f5f5f5",
              color: memoTag === "after" ? "#fff" : "#333",
              fontWeight: 500,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            방문 후
          </button>
        </div>

        {/* ✅ 저장/수정 버튼 */}
        <button className={styles.primaryBtn} onClick={handlePrimaryClick}>
          {isSaved ? "변경사항 저장" : "내 장소로 저장하기"}
        </button>

        {/* ✅ 저장된 장소면 삭제 버튼도 노출 */}
        {isSaved && (
          <button
            className={styles.deleteBtn}
            onClick={() => {
              if (place._id && typeof onDelete === "function")
                onDelete(place._id);
            }}
          >
            저장 삭제하기
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 0.5 단위 별점 선택기
 * - 0.5 ~ 5.0 (10칸)
 * - 클릭하면 value가 0.5 단위로 바뀜
 */
function HalfStarPicker({ value, onChange }) {
  // 0.5~5.0까지 10개
  const steps = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

  return (
    <div className={styles.pickerWrap}>
      {/* 시각적 별(5개) */}
      <StarVisual value={value} />

      {/* 클릭 영역(10개) */}
      <div className={styles.stepGrid}>
        {steps.map((v) => (
          <button
            key={v}
            type="button"
            className={styles.stepBtn}
            style={{
              outline: value === v ? "2px solid #007bff" : "none",
            }}
            onClick={() => onChange(v)}
            aria-label={`내 평점 ${v}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * value(0~5)를 별 모양으로 시각화
 * - 5개의 별을 SVG로 그리고, 채움 정도를 value에 맞춰 표시
 */
function StarVisual({ value }) {
  const v = value ?? 0;

  return (
    <div className={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, v - (i - 1))); // 0~1
        return <Star key={i} fill={fill} />;
      })}
    </div>
  );
}

function Star({ fill }) {
  // fill: 0~1 (0, 0.5, 1)
  const pct = Math.round(fill * 100);
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" style={{ marginRight: 2 }}>
      <defs>
        <linearGradient id={`g${pct}`}>
          <stop offset={`${pct}%`} stopColor="#FFD700" />
          <stop offset={`${pct}%`} stopColor="#E0E0E0" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l2.9 6.2 6.8.6-5.2 4.5 1.6 6.7L12 16.9 5.9 20l1.6-6.7L2.3 8.8l6.8-.6L12 2z"
        fill={`url(#g${pct})`}
        stroke="#B0B0B0"
      />
    </svg>
  );
}

export default BasicInfoModal;
