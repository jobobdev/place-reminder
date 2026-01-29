// frontend/src/components/saveSheet/SavePlaceSheet.jsx
import { useState } from "react";

import emptyStar from "@/assets/icons/emptystar_icon.svg";
import halfStar from "@/assets/icons/halfstar_icon.svg";
import fullStar from "@/assets/icons/fullstar_icon.svg";
import alertOffIcon from "@/assets/icons/no_alarm_icon.svg";
import alertOnIcon from "@/assets/icons/yes_alarm_icon.svg";
import closeIcon from "@/assets/icons/bottomsheet_close_icon.svg";
/**
 * SavePlaceSheet
 *
 * - isOpen=false 이거나 place=null 이면 렌더링하지 않음
 * - place가 바뀌면(key 변경) 내부 컴포넌트를 remount하여
 *   useEffect 없이 useState 초기값만으로 로컬 편집 상태를 세팅한다.
 */
export default function SavePlaceSheet({
  isOpen,
  place,
  isSaved,
  onCreate,
  onUpdate,
  onClose,
  onDelete,
}) {
  if (!isOpen || !place) return null;

  // ✅ place가 바뀌면 완전히 새로 mount 되어 초기값이 다시 세팅됨
  const sheetKey =
    place._id ?? place.place_id ?? `${place.name}-${place.address}`;

  return (
    <SavePlaceSheetBody
      key={sheetKey}
      place={place}
      isSaved={isSaved}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onClose={onClose}
      onDelete={onDelete}
    />
  );
}

/* ======================================================
 * Inner (Hooks here - always called)
 * ====================================================== */

function SavePlaceSheetBody({
  place,
  isSaved,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}) {
  /* ===================== Local Editable State ===================== */
  // ✅ useEffect 없이 초기값으로만 세팅 (remount로 place 변경 대응)
  const [myRating, setMyRating] = useState(place.myRating ?? null);
  const [memoText, setMemoText] = useState(place.memo?.text ?? "");
  const [alertEnabled, setAlertEnabled] = useState(place.alertEnabled ?? false);
  const [visited, setVisited] = useState(place.visited ?? false);
  const [hiddenAfterVisited, setHiddenAfterVisited] = useState(
    place.hiddenAfterVisited ?? false
  );

  /* ===================== Handlers ===================== */

  const handleSave = async () => {
    const payload = {
      myRating,
      memo: {
        text: memoText,
        // visited는 이 시트에서 수정하지 않는 전제
        tag: place.visited ? "after" : "before",
      },
      alertEnabled,
      visited,
      hiddenAfterVisited,
    };

    if (isSaved) {
      await onUpdate?.(place._id, payload);
    } else {
      await onCreate?.({
        name: place.name,
        address: place.address,
        rating: place.rating,
        reviews: place.reviews,
        hours: place.hours,
        position: place.position,
        ...payload,
      });
    }

    onClose?.();
  };
  const handleDelete = async () => {
    if (!isSaved || !place._id) return;
    await onDelete?.(place._id);
  };

  /* ===================== UI ===================== */

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>{place.name}</div>
        <img
          src={closeIcon}
          alt="close"
          width={24}
          height={24}
          style={{ cursor: "pointer" }}
          onClick={() => onClose?.()}
        />
      </div>

      {/* Content */}
      <div style={contentStyle}>
        <section>
          <SectionTitle>내 평점</SectionTitle>
          <StarRating value={myRating} onChange={setMyRating} />
        </section>
        <section style={{ marginTop: 16 }}>
          <SectionTitle>메모</SectionTitle>
          <textarea
            style={textareaStyle}
            placeholder="이 장소에 대한 메모를 남겨보세요"
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
          />
        </section>
        <section style={{ marginTop: 20 }}>
          <SectionTitle>근처 도착 알림</SectionTitle>

          <div
            onClick={() => setAlertEnabled((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <img
              src={alertEnabled ? alertOnIcon : alertOffIcon}
              alt="alert-toggle"
              width={24}
              height={24}
            />
            <span style={{ fontSize: 13 }}>
              {alertEnabled ? "알림 켜짐" : "알림 꺼짐"}
            </span>
          </div>
        </section>
        {/* 방문 여부 */}
        <section style={{ marginTop: 20 }}>
          <SectionTitle>방문 여부</SectionTitle>

          <div
            onClick={() => {
              const nextVisited = !visited;
              setVisited(nextVisited);

              // ✅ 정책: 방문 처리 시 알림 자동 OFF
              if (nextVisited) {
                setAlertEnabled(false);
              }

              // 방문 OFF로 되돌리면 숨김도 자동 OFF
              if (!nextVisited) {
                setHiddenAfterVisited(false);
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input type="checkbox" checked={visited} readOnly />
            <span style={{ fontSize: 13 }}>
              {visited ? "방문함" : "방문 전"}
            </span>
          </div>
        </section>
        +{/* 방문 완료 후 지도 숨기기 */}
        <section style={{ marginTop: 16, opacity: visited ? 1 : 0.4 }}>
          <div
            onClick={() => {
              if (!visited) return;
              setHiddenAfterVisited((v) => !v);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: visited ? "pointer" : "not-allowed",
            }}
          >
            <span style={{ fontSize: 13 }}>
              방문 완료한 장소 지도에서 핀 숨기기
            </span>
            <div style={{ marginLeft: 8 }}>
              {hiddenAfterVisited ? "(   O)" : "( O   )"}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        {isSaved && (
          <div className="delete-container" style={deleteContainer}>
            <button style={dangerButton} onClick={handleDelete}>
              장소 삭제
            </button>
          </div>
        )}
        <button style={primaryButton} onClick={handleSave}>
          {isSaved ? "변경 저장" : "저장하기"}
        </button>
      </div>
    </div>
  );
}

/* ======================================================
 * Sub Components
 * ====================================================== */

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const base = i + 1;
        let icon = emptyStar;

        if ((value ?? 0) >= base) icon = fullStar;
        else if ((value ?? 0) >= base - 0.5) icon = halfStar;

        return (
          <div key={i} style={{ position: "relative", width: 28, height: 28 }}>
            {/* full click */}
            <img
              src={icon}
              alt="star"
              style={{ width: 28, height: 28, cursor: "pointer" }}
              onClick={() => onChange(base)}
            />

            {/* half click zone */}
            <div
              onClick={() => onChange(base - 0.5)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "50%",
                height: "100%",
                cursor: "pointer",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontWeight: 700, marginBottom: 6 }}>{children}</div>;
}

/* ======================================================
 * Styles
 * ====================================================== */

const containerStyle = {
  position: "fixed",
  inset: 0,
  background: "#fff",
  zIndex: 200,
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px",
  borderBottom: "1px solid #eee",
};

const titleStyle = {
  fontWeight: 700,
  fontSize: 16,
  lineHeight: 1.3,
};

const contentStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
};

const textareaStyle = {
  width: "100%",
  height: 100,
  padding: 8,
};

const footerStyle = {
  padding: 16,
  borderTop: "1px solid #eee",
};

const primaryButton = {
  width: "100%",
  padding: "14px",
  background: "#007bff",
  color: "#fff",
  fontWeight: 700,
  border: "none",
  borderRadius: 8,
};

const deleteContainer = {
  width: "100%",
  padding: "2px",
  border: "none",
  background: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  marginBottom: 10,
};

const dangerButton = {
  color: "#ff4d4f",
  fontWeight: 700,
  fontSize: 12,
  background: "transparent",
  border: "none",
};
