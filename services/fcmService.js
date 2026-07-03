const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let isFirebaseInitialized = false;

function initFirebase() {
    // Chỉ khởi tạo nếu người dùng điền đúng Private Key (không chứa chữ 'your_')
    if (process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID.includes('your_')) {
        try {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                })
            });
            isFirebaseInitialized = true;
            console.log("[FCM] Firebase Admin SDK initialized.");
        } catch (err) {
            console.error("[FCM] Init error:", err.message);
        }
    } else {
        console.warn("[FCM] Credentials not set. Push notifications disabled.");
    }
}

async function sendNotification(title, body, topic = "weather_alerts") {
    if (!isFirebaseInitialized) return;

    const message = {
        notification: {
            title: title,
            body: body
        },
        topic: topic
    };

    try {
        const response = await getMessaging().send(message);
        console.log("[FCM] Gửi thông báo thành công:", response);
    } catch (error) {
        console.error("[FCM] Lỗi gửi thông báo:", error.message);
    }
}

module.exports = { initFirebase, sendNotification };
