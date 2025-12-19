const statusEl = document.getElementById("status");
const enableBtn = document.getElementById("enable");
const testBtn = document.getElementById("test");

// ====== 要跟後端一致 ======
const VAPID_PUBLIC_KEY = "PASTE_YOUR_VAPID_PUBLIC_KEY";
// 後端網址（本機測試用）
const SERVER = "http://localhost:3000";
// =========================

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

enableBtn.onclick = async () => {
  if (!("serviceWorker" in navigator)) {
    statusEl.textContent = "此瀏覽器不支援 Service Worker";
    return;
  }
  if (!("PushManager" in window)) {
    statusEl.textContent = "此瀏覽器不支援 Push";
    return;
  }

  const reg = await navigator.serviceWorker.register("/sw.js");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    statusEl.textContent = "你拒絕了通知權限，無法推播。";
    return;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await fetch(`${SERVER}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  statusEl.textContent = "已啟用推播 ✅（每天 21:00 會提醒）";
};

testBtn.onclick = async () => {
  await fetch(`${SERVER}/push-test`, { method: "POST" });
  statusEl.textContent = "已送出測試推播（如果沒收到，檢查權限/瀏覽器）";
};
