import express from "express";
import bodyParser from "body-parser";
import webpush from "web-push";
import cron from "node-cron";

const app = express();
app.use(bodyParser.json());

// 產生 VAPID Keys（只要做一次）
// 你可以先把下面這段跑一次後，把 console 印出的 keys 填回 VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
// console.log(webpush.generateVAPIDKeys());

// ====== 你要填的地方（生成後貼上） ======
const VAPID_PUBLIC_KEY = "PASTE_YOUR_VAPID_PUBLIC_KEY";
const VAPID_PRIVATE_KEY = "PASTE_YOUR_VAPID_PRIVATE_KEY";
// =====================================

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// 簡單起見：用記憶體存訂閱（正式上線建議存 DB）
const subscriptions = new Set();

// 前端會把 push subscription POST 到這裡
app.post("/subscribe", (req, res) => {
  const sub = req.body;
  subscriptions.add(JSON.stringify(sub));
  res.status(201).json({ ok: true });
});

// 測試用：手動觸發推播
app.post("/push-test", async (req, res) => {
  await sendPushToAll({
    title: "測試提醒",
    body: "這是一則測試推播，確定能收到就 OK。",
    url: "/"
  });
  res.json({ ok: true });
});

async function sendPushToAll(payloadObj) {
  const payload = JSON.stringify(payloadObj);

  for (const subStr of Array.from(subscriptions)) {
    const sub = JSON.parse(subStr);
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err) {
      // 訂閱失效就移除
      subscriptions.delete(subStr);
    }
  }
}

// 每天 21:00（台北時間）推播
cron.schedule(
  "0 21 * * *",
  async () => {
    await sendPushToAll({
      title: "輿論回報時間到（21:00）",
      body: "請回報過去 24 小時：輿論方向 / 討論焦點 / 熱點連結。",
      url: "/"
    });
  },
  { timezone: "Asia/Taipei" }
);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
