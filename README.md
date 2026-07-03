# Smart Weather Monitoring System

Website Dashboard cho đồ án IoT giám sát thời tiết, xây dựng bằng Node.js, Express, SQLite, Socket.IO, tích hợp AI (Google Gemini) và push notification (Firebase Cloud Messaging).

## Yêu cầu hệ thống
- Node.js (v18 trở lên)
- NPM

## Cài đặt

1. Cài đặt các thư viện:
```bash
npm install
```

2. Cấu hình biến môi trường:
- Đổi tên file `.env.example` thành `.env`.
- Điền các thông số API Key của bạn (Google Gemini, OpenWeatherMap, Firebase credentials).

3. Cấu hình Firebase cho Frontend:
- Mở file `public/firebase-messaging-sw.js` và điền cấu hình `firebase.initializeApp({...})`.
- Mở `views/layout.ejs` và bổ sung `firebase.initializeApp` trước khi gọi `firebase.messaging()`.

## Chạy Server

Chế độ phát triển (Tự động khởi động lại khi sửa code):
```bash
npx nodemon app.js
```

Truy cập trên trình duyệt: `http://localhost:3000`

Tài khoản mặc định: 
- Username: `admin`
- Password: `admin`

## API ESP32 (Gửi dữ liệu lên)

`POST http://<IP_MAY_TINH>:3000/api/sensor`

**Headers:**
`Content-Type: application/json`

**Body:**
```json
{
    "temperature": 29.8,
    "humidity": 70.0,
    "pressure": 1005.0,
    "rain": 0,
    "light": 320
}
```
