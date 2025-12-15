/**
 * 브라우저 알림 표시
 */
export function showNotification(title, body) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icon.png",
    });
  }
}
