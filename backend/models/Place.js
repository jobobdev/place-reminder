// backend/models/Place.js
import mongoose from "mongoose";

const PlaceSchema = new mongoose.Schema({
  name: String,
  address: String,
  rating: Number,
  reviews: Number,
  hours: [String],
  position: {
    lat: Number,
    lng: Number,
  },
  memo: {
    text: {
      type: String,
      default: "",
    },
    tag: {
      type: String,
      enum: ["before", "after"],
      default: "before",
    },
  },
  // 근처 도착 알림 활성화 여부
  alertEnabled: {
    type: Boolean,
    default: false,
  },
  // ✅ STEP 3: 나만의 평점 (0.5 ~ 5.0, 0.5 단위)
  myRating: {
    type: Number,
    default: null, // 아직 평가 안함
    min: 0,
    max: 5,
    validate: {
      validator: (v) =>
        v === null ||
        (Number.isFinite(v) && Math.abs(v * 2 - Math.round(v * 2)) < 1e-9),
      message: "myRating은 0.5 단위(예: 3.5)여야 합니다.",
    },
  },

  // (선택) 확장용 - 방문 여부
  visited: {
    type: Boolean,
    default: false,
  },

  // ✅ 방문 완료한 장소를 지도에서 숨길지 여부 (visited=true일 때만 의미)
  // 정책: true로 켜는 순간 alertEnabled도 함께 꺼진다(서버에서 강제)
  hiddenAfterVisited: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Place", PlaceSchema);
