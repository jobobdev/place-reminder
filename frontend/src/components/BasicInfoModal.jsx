// BasicInfoModal.jsx
import { useState } from "react";

function BasicInfoModal({ place, onClose, onSave, isSaved, onDelete }) {
  // ✅ Hook은 무조건 최상단
  const [memo, setMemo] = useState(place?.memo || "");

  // ✅ place 없으면 여기서 return
  if (!place) return null;

  const handleSaveClick = () => {
    onSave({
      ...place,
      memo,
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.closeBtn} onClick={onClose}>
          ×
        </div>

        <h2>{place.name}</h2>

        {isSaved && (
          <p style={{ color: "#007bff", fontWeight: "bold" }}>📌 저장된 장소</p>
        )}

        {/* ✅ B안: 운영시간 표시 — 여기 */}
        {Array.isArray(place.hours) && place.hours.length > 0 && (
          <>
            <p style={{ fontWeight: "bold", marginTop: "8px" }}>운영 시간</p>
            <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
              {place.hours.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </>
        )}

        <textarea
          style={styles.textarea}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모를 입력하세요 (선택)"
        />

        {!isSaved && (
          <button style={styles.saveBtn} onClick={handleSaveClick}>
            내 장소로 저장하기
          </button>
        )}

        {isSaved && (
          <button style={styles.deleteBtn} onClick={() => onDelete(place._id)}>
            저장 삭제하기
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  modal: {
    background: "white",
    width: "80%",
    maxWidth: "400px",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: "8px",
    right: "12px",
    fontSize: "22px",
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    height: "80px",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    resize: "none",
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    marginTop: "12px",
    backgroundColor: "#007bff",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
  deleteBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    marginTop: "12px",
    backgroundColor: "#dc3545",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default BasicInfoModal;
