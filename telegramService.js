const https = require('https');

async function sendAlert(title, message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Chỉ gửi nếu người dùng đã cấu hình Token và Chat ID
    if (!token || !chatId || token === 'your_bot_token_here') {
        console.warn("[Telegram] Chưa cấu hình Bot Token hoặc Chat ID. Bỏ qua thông báo.");
        return;
    }

    const textToSend = `🚨 *${title}*\n\n${message}`;

    const data = JSON.stringify({
        chat_id: chatId,
        text: textToSend,
        parse_mode: 'Markdown'
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log("[Telegram] Gửi thông báo thành công!");
                    resolve(true);
                } else {
                    console.error("[Telegram] Lỗi gửi thông báo API Telegram:", responseBody);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error("[Telegram] Lỗi kết nối mạng:", error.message);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

module.exports = { sendAlert };
