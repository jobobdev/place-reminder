// BasicInfoModal.jsx
// 선택된 장소의 기본 정보를 보여주는 모달 + "내 장소로 저장하기" 버튼
import { useState } from "react";

function BasicInfoModal({ place, onClose, onSave }) {
    // 메모는 모달 내부에서만 관리하다가, 저장 시에 함께 전달
    const [memo, setMemo] = useState("");

    if(!place) return null; //장소 정보 없으면 렌더링하지 않음

    const handleSaveClick = () => {
    // 기존 place 정보 + memo를 합쳐서 onSave로 전달
        onSave({
            ...place,
            memo: memo,
        });
    };

    return (
        <div style={styles.overlay}> 
            <div style={styles.modal}>
                {/* 닫기 버튼 */}
                <div style={styles.closeBtn} onClick={onClose}>
                    ×
                </div>

                <h2 style={{ marginBottom: "10px"}}>{place.name}</h2>

                <p>
                    <strong>주소:</strong> {place.address}
                </p>
                <p>
                    <strong>평점:</strong> {place.rating ?? "정보 없음"} ⭐ (
                     {place.reviews ?? 0}명)
                </p>
                <p>
                    <strong>운영 시간:</strong>
                </p>
                <ul>
                    {place.hours.length > 0 ? (
                        place.hours.map((line, idx) => <li key={idx}>{line}</li>)
                    ) : (
                        <li>영업시간 정보 없음</li>
                    )}
                </ul>

                {/* 메모 입력란 */}
                <textarea
                    style={styles.textarea}
                     placeholder="메모를 입력하세요 (선택)"
                     value={memo}
                     onChange={(e) => setMemo(e.target.value)}
                />
                
                {/* 저장 버튼 */}   
                <button style={styles.saveBtn} onClick={handleSaveClick}>
                    내 장소로 저장하기
                </button>
            </div>
        </div>
    )
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
};

export default BasicInfoModal;


