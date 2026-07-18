const https = require('https');

async function sendAlert(title, message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) return;

    const textToSend = `🚨 *${title}*\n\n${message}`;
    const data = JSON.stringify({ chat_id: chatId, text: textToSend, parse_mode: 'Markdown' });

    const options = {
        hostname: 'api.telegram.org', port: 443,
        path: `/bot${token}/sendMessage`, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve(res.statusCode === 200));
        });
        req.on('error', () => resolve(false));
        req.write(data);
        req.end();
    });
}
module.exports = { sendAlert };
