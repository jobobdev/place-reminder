// src/hooks/useNotificationPermission.js

import { useEffect } from "react";

/**
 * 브라우저 알림(Notification) 권한을 요청하는 Hook
 *
 * - 앱이 처음 실행될 때(최초 렌더링 시) 1번만 실행
 * - 사용자가 허용/차단을 선택하면 이후에는 브라우저가 기억한다
 */
export default function useNotificationPermission() {
  useEffect(() => {
    // Notification API 지원 여부 체크
    if (!("Notification" in window)) return;

    // default: 아직 허용/차단을 선택하지 않은 상태
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}
