// express.Router(): 라우터(= 작은 서버 조각) 생성 도구
// - Express 앱은 여러 개의 라우터로 기능을 나눌 수 있음
// - 예: /places 전용 라우터, /users 전용 라우터 등
import express from "express";
import Place from "../models/Place.js";

const router = express.Router();
// 위 코드는 미니 서버를 하나 생성한다고 보면 됨
// app.get(), app.post()처럼 라우팅이 가능함
// 이렇게 분리하면 코드 구조가 깔끔해지고 유지보수가 쉬워짐

// 장소 저장 API
router.post("/", async (req, res) => {
  try {
    const place = await Place.create(req.body);
    res.status(201).json(place);
  } catch (eroor) {
    console.error("장소 저장 오류:", err);
    res.status(500).json({ error: "서버 오류로 장소를 저장할 수 없습니다." });
  }
});

// 저장된 장소들 가져오기 API
// [GET] 모든 저장된 장소 목록 조회
// 프론트엔드가 지도에 마커를 뿌릴 때 사용할 API
router.get("/", async (req, res) => {
  try {
    const places = await Place.find(); // MongdoDB에서 모든 장소 문서 조회
    res.json(places); // 조회된 장소들을 JSON 형식으로 응답 -> 프론트로 반환
  } catch (error) {
    console.error("장소 조회 오류:", error);
    res.status(500).json({ error: "서버 오류로 장소를 불러올 수 없습니다." });
  }
});

export default router;
