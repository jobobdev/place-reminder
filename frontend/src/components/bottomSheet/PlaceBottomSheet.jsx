// frontend/src/components/bottomSheet/PlaceBottomSheet.jsx
import { useState } from "react";
import useSheetDrag from "./useSheetDrag";

import visitOffIcon from "@/assets/icons/place_notvisited_icon.svg";
import visitOnIcon from "@/assets/icons/place_visited_icon.svg";
import alertOffIcon from "@/assets/icons/no_alarm_header_icon.svg";
import alertOnIcon from "@/assets/icons/yes_alarm_header_icon.svg";
import saveOffIcon from "@/assets/icons/place_notsaved_icon.svg";
import saveOnIcon from "@/assets/icons/place_saved_icon.svg";
import closeIcon from "@/assets/icons/bottomsheet_close_icon.svg";

export default function PlaceBottomSheet({
  place,
  sheetState,
  setSheetState,
  isSaved,
  onOpenSaveSheet,
  onToggleVisited,
  onToggleAlert,
  onClose,
}) {
  const { dragHeight, handlers } = useSheetDrag({ sheetState, setSheetState });
  const [isVisitConfirmOpen, setIsVisitConfirmOpen] = useState(false);

  if (!place || sheetState === "hidden") return null;

  /* ===================== Layout ===================== */

  const heightByState = {
    peek: "120px",
    partial: "45vh",
    full: "100vh",
  };

  const containerStyle = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: dragHeight ? `${dragHeight}px` : heightByState[sheetState],
    transition: dragHeight ? "none" : "height 0.25s ease",
    backgroundColor: "#fff",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    boxShadow: "0 -6px 20px rgba(0,0,0,0.15)",
    zIndex: 100,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={containerStyle} {...handlers}>
      <div style={headerStyle}>
        <div style={titleStyle}>{place.name}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 방문 토글 */}
          {isSaved && (
            <img
              src={place.visited ? visitOnIcon : visitOffIcon}
              alt="visit-toggle"
              width={32}
              height={32}
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (!place.visited) {
                  setIsVisitConfirmOpen(true);
                  return;
                }
                onToggleVisited?.();
              }}
            />
          )}

          {/* 알림 토글 */}
          <img
            src={place.alertEnabled ? alertOnIcon : alertOffIcon}
            alt="alert-toggle"
            width={32}
            height={32}
            style={{ cursor: "pointer" }}
            onClick={() => onToggleAlert?.()}
          />

          {/* 저장 / 편집 */}
          <img
            src={isSaved ? saveOnIcon : saveOffIcon}
            alt="save"
            width={32}
            height={32}
            style={{ cursor: "pointer" }}
            onClick={() => onOpenSaveSheet?.()}
          />

          {/* 닫기 */}
          <img
            src={closeIcon}
            alt="close"
            width={32}
            height={32}
            style={{ cursor: "pointer" }}
            onClick={() => onClose?.()}
          />
        </div>
      </div>
      {/* ================= Content ================= */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {sheetState === "peek" && <PeekContent place={place} />}
        {sheetState === "partial" && <PartialContent place={place} />}
        {sheetState === "full" && <FullContent place={place} />}
      </div>

      {isVisitConfirmOpen && (
        <div
          style={visitConfirmOverlayStyle}
          onClick={() => setIsVisitConfirmOpen(false)}
        >
          <div
            style={visitConfirmModalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={visitConfirmTitleStyle}>
              방문한 장소는 근처 알림이 비활성화됩니다
            </div>
            <div style={visitConfirmActionsStyle}>
              <button
                type="button"
                style={visitConfirmSecondaryButtonStyle}
                onClick={() => {
                  setIsVisitConfirmOpen(false);
                  onToggleVisited?.({ keepAlert: true });
                }}
              >
                알림 유지
              </button>
              <button
                type="button"
                style={visitConfirmPrimaryButtonStyle}
                onClick={() => {
                  setIsVisitConfirmOpen(false);
                  onToggleVisited?.({ keepAlert: false });
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================
 * Sub Components
 * ====================================================== */

/* ------------------ Peek ------------------ */
function PeekContent({ place }) {
  return (
    <>
      <div>
        <TextRow label="내 평점" value={place.myRating ?? "미입력"} />
      </div>
      <div>
        <TextRow label="Google" value={place.rating ?? "정보 없음"} />
      </div>
      <div style={memoPreviewStyle}>
        메모: {place.memo?.text || "메모 없음"}
      </div>
    </>
  );
}

/* ------------------ Partial / Full ------------------ */
function PartialContent({ place }) {
  return (
    <>
      <Section title="평점">
        <TextRow label="내 평점" value={place.myRating ?? "미입력"} />
        <TextRow label="Google" value={place.rating ?? "정보 없음"} />
      </Section>

      <Section title="오늘 영업시간">
        <div style={{ fontSize: 12, color: "#444" }}>
          {getTodayHours(place.hours) ?? "정보 없음"}
        </div>
      </Section>

      <Section title="메모">
        <div style={{ fontSize: 12, color: "#444" }}>
          {place.memo?.text || "메모 없음"}
        </div>
      </Section>
    </>
  );
}

function FullContent({ place }) {
  return (
    <>
      <PartialContent place={place} />
      <Section title="전체 영업시간">
        {(place.hours || []).map((h, i) => (
          <div key={i} style={{ fontSize: 12, color: "#444" }}>
            {h}
          </div>
        ))}
      </Section>
      <Section title="사진">
        <div style={{ fontSize: 12, color: "#444" }}>
          (다음 단계: Google Places Photos)
        </div>
      </Section>
    </>
  );
}

function getTodayHours(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return null;
  // 단순 버전: 일단 첫 줄을 '오늘'로 표시 (추후 요일 매핑으로 개선)
  return hours[0];
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function TextRow({ label, value }) {
  return (
    <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
      {label} · {value}
    </div>
  );
}

/* ======================================================
 * Styles
 * ====================================================== */

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #eee",
};
const titleStyle = {
  fontWeight: 700,
  fontSize: 18,
  lineHeight: 1.3,
  maxWidth: "70%",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const memoPreviewStyle = {
  fontSize: 11,
  color: "#666",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const visitConfirmOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.35)",
  zIndex: 110,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 24px",
};

const visitConfirmModalStyle = {
  width: "100%",
  maxWidth: 320,
  backgroundColor: "#fff",
  borderRadius: 14,
  padding: "18px 16px 14px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
};

const visitConfirmTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#222",
  textAlign: "center",
  lineHeight: 1.4,
};

const visitConfirmActionsStyle = {
  display: "flex",
  gap: 8,
  marginTop: 14,
};

const visitConfirmPrimaryButtonStyle = {
  flex: 1,
  height: 36,
  borderRadius: 10,
  border: "none",
  backgroundColor: "#1a73e8",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const visitConfirmSecondaryButtonStyle = {
  flex: 1,
  height: 36,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  color: "#333",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
