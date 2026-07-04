document.addEventListener("DOMContentLoaded", () => {
    const socket = io();

    // ─── SPARKLINE MINI CHARTS ───
    const sparkData = {
        temp: [], hum: [], pres: [], rain: [], wind: [], light: []
    };
    const sparkCharts = {};

    function createSparkline(canvasId, color) {
        const el = document.getElementById(canvasId);
        if (!el) return null;
        return new Chart(el, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: color,
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: color.replace('1)', '0.08)'),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
                animation: { duration: 400, easing: 'easeInOutQuart' }
            }
        });
    }

    if (document.getElementById('spark-temp')) {
        sparkCharts.temp  = createSparkline('spark-temp',  'rgba(248,113,113,1)');
        sparkCharts.hum   = createSparkline('spark-hum',   'rgba(56,189,248,1)');
        sparkCharts.pres  = createSparkline('spark-pres',  'rgba(250,204,21,1)');
        sparkCharts.rain  = createSparkline('spark-rain',  'rgba(129,140,248,1)');
        sparkCharts.wind  = createSparkline('spark-wind',  'rgba(45,212,191,1)');
        sparkCharts.light = createSparkline('spark-light', 'rgba(251,146,60,1)');
    }

    function pushSparkData(key, value) {
        sparkData[key].push(value);
        if (sparkData[key].length > 15) sparkData[key].shift();
        if (sparkCharts[key]) {
            sparkCharts[key].data.labels = sparkData[key].map((_, i) => i);
            sparkCharts[key].data.datasets[0].data = sparkData[key];
            sparkCharts[key].update('none');
        }
    }

    // ─── MAIN CHART (Upgraded) ───
    let ctx = document.getElementById('weatherChart');
    let weatherChart;
    if (ctx) {
        const gradient1 = ctx.getContext('2d').createLinearGradient(0, 0, 0, 350);
        gradient1.addColorStop(0, 'rgba(248,113,113,0.15)');
        gradient1.addColorStop(1, 'rgba(248,113,113,0)');
        
        const gradient2 = ctx.getContext('2d').createLinearGradient(0, 0, 0, 350);
        gradient2.addColorStop(0, 'rgba(56,189,248,0.15)');
        gradient2.addColorStop(1, 'rgba(56,189,248,0)');

        weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Nhiệt độ (°C)',
                        data: [],
                        borderColor: '#f87171',
                        backgroundColor: gradient1,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#f87171',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                    },
                    {
                        label: 'Độ ẩm (%)',
                        data: [],
                        borderColor: '#38bdf8',
                        backgroundColor: gradient2,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#38bdf8',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    },
                    y: {
                        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255,255,255,0.6)',
                            font: { family: 'Inter', size: 12, weight: '500' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10,14,26,0.9)',
                        titleColor: '#fff',
                        bodyColor: 'rgba(255,255,255,0.8)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        titleFont: { family: 'Inter', weight: '600' },
                        bodyFont: { family: 'Inter' },
                        displayColors: true,
                        boxPadding: 4,
                    }
                },
                animation: { duration: 600, easing: 'easeInOutQuart' }
            }
        });
    }

    // ─── LOAD INITIAL DATA ───
    if (document.getElementById('card-temp')) {
        fetch('/api/latest')
            .then(res => res.json())
            .then(data => updateCards(data))
            .catch(() => {});

        fetch('/api/history?limit=15')
            .then(res => res.json())
            .then(data => {
                if (weatherChart) {
                    data.reverse().forEach(row => {
                        const label = moment(row.created_at).format('HH:mm');
                        weatherChart.data.labels.push(label);
                        weatherChart.data.datasets[0].data.push(row.temperature);
                        weatherChart.data.datasets[1].data.push(row.humidity);
                        // Sparklines
                        pushSparkData('temp', row.temperature);
                        pushSparkData('hum', row.humidity);
                        pushSparkData('pres', row.pressure);
                        pushSparkData('rain', row.rain_mm || 0);
                        pushSparkData('wind', row.wind_kmh || 0);
                        pushSparkData('light', row.light);
                    });
                    weatherChart.update();
                }
            })
            .catch(() => {});
    }

    // ─── REALTIME SOCKET ───
    socket.on('new_sensor_data', (data) => {
        updateCards(data);
        if (weatherChart) {
            if (weatherChart.data.labels.length > 20) {
                weatherChart.data.labels.shift();
                weatherChart.data.datasets[0].data.shift();
                weatherChart.data.datasets[1].data.shift();
            }
            weatherChart.data.labels.push(moment().format('HH:mm'));
            weatherChart.data.datasets[0].data.push(data.temperature);
            weatherChart.data.datasets[1].data.push(data.humidity);
            weatherChart.update();
        }
    });

    socket.on('new_ai_report', (aiResult) => {
        const btn = document.getElementById('btn-force-ai');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-arrow-rotate-right"></i> Làm mới';
            btn.disabled = false;
        }
        updateAiUi(aiResult);
    });

    // ─── STATUS HELPERS ───
    function getTempStatus(t) {
        if (t < 15) return 'Lạnh';
        if (t < 20) return 'Mát mẻ';
        if (t <= 30) return 'Dễ chịu';
        if (t <= 35) return 'Ấm';
        return 'Nóng bức';
    }
    function getHumStatus(h) {
        if (h < 30) return 'Khô';
        if (h <= 60) return 'Dễ chịu';
        if (h <= 80) return 'Ẩm';
        return 'Rất ẩm';
    }
    function getPresStatus(p) {
        if (p < 1000) return 'Thấp';
        if (p <= 1020) return 'Bình thường';
        return 'Cao';
    }
    function getLightStatus(l) {
        if (l < 10) return 'Tối';
        if (l < 200) return 'Lờ mờ';
        if (l < 1000) return 'Vừa phải';
        return 'Chói';
    }
    function getWindStatus(w) {
        if (w < 5) return 'Lặng gió';
        if (w < 20) return 'Gió nhẹ';
        if (w < 40) return 'Trung bình';
        return 'Gió mạnh';
    }

    // ─── UPDATE CARDS ───
    function updateCards(data) {
        if (!data.temperature) return;

        const setVal = (id, val, unit) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = val + '<span class="unit">' + unit + '</span>';
        };

        setVal('card-temp', data.temperature, '°C');
        setVal('card-hum', data.humidity, '%');
        setVal('card-pres', data.pressure, 'hPa');
        setVal('card-rain', (data.rain_mm || 0), 'mm');
        setVal('card-wind', (data.wind_kmh || 0), 'km/h');
        setVal('card-light', data.light, 'lux');

        // Status text
        const setSt = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        setSt('status-temp', getTempStatus(data.temperature));
        setSt('status-hum', getHumStatus(data.humidity));
        setSt('status-pres', getPresStatus(data.pressure));
        setSt('status-wind', getWindStatus(data.wind_kmh || 0));
        setSt('status-light', getLightStatus(data.light));

        // Rain status badge
        const rainEl = document.getElementById('status-rain');
        if (rainEl) {
            if (data.rain) {
                rainEl.innerHTML = '<span class="badge badge-rain-yes"><i class="fa-solid fa-droplet"></i> Đang mưa</span>';
            } else {
                rainEl.innerHTML = '<span class="badge badge-rain-no"><i class="fa-solid fa-check"></i> Khô ráo</span>';
            }
        }

        // Sparklines
        pushSparkData('temp', data.temperature);
        pushSparkData('hum', data.humidity);
        pushSparkData('pres', data.pressure);
        pushSparkData('rain', data.rain_mm || 0);
        pushSparkData('wind', data.wind_kmh || 0);
        pushSparkData('light', data.light);

        // Restore AI if available
        if (data.aiResult) {
            updateAiUi(data.aiResult);
        }
    }

    // ─── UPDATE AI UI ───
    function updateAiUi(aiResult) {
        const box = document.getElementById('ai-realtime-box');
        if (!box) return;

        // Risk badge
        let riskBadge = '';
        const r = aiResult.risk;
        if (r === 'Low' || r === 'Thấp') {
            riskBadge = '<span class="badge badge-success"><i class="fa-solid fa-shield-check"></i> ' + r + '</span>';
        } else if (r === 'Medium' || r === 'Trung bình') {
            riskBadge = '<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> ' + r + '</span>';
        } else if (r === 'High' || r === 'Cao') {
            riskBadge = '<span class="badge badge-danger"><i class="fa-solid fa-exclamation-circle"></i> ' + r + '</span>';
        } else {
            riskBadge = '<span class="badge badge-critical"><i class="fa-solid fa-skull-crossbones"></i> ' + r + '</span>';
        }

        // Recommendations
        let recHtml = '';
        if (Array.isArray(aiResult.recommendations)) {
            recHtml = aiResult.recommendations.map(rec =>
                `<div class="rec-item"><i class="fa-solid fa-circle-check"></i><span>${rec}</span></div>`
            ).join('');
        }

        // Alert
        let alertHtml = '';
        if (aiResult.alert && aiResult.alert !== "Không có cảnh báo.") {
            alertHtml = `
                <div class="alert-banner">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div>
                        <div class="alert-banner-title">Cảnh báo</div>
                        <div class="alert-banner-text">${aiResult.alert}</div>
                    </div>
                </div>`;
        }

        box.innerHTML = `
            ${alertHtml}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Left Column -->
                <div class="space-y-4">
                    <div class="ai-block">
                        <div class="ai-block-label">Trạng thái hiện tại</div>
                        <div class="text-lg font-semibold">${aiResult.status}</div>
                    </div>
                    <div class="ai-block">
                        <div class="ai-block-label">Mức độ rủi ro</div>
                        <div class="mt-1">${riskBadge}</div>
                    </div>
                    <div class="ai-block">
                        <div class="ai-block-label">Xu hướng</div>
                        <div class="ai-block-value"><i class="fa-solid fa-arrow-trend-up text-accent mr-2"></i>${aiResult.trend}</div>
                    </div>
                    <div class="ai-block">
                        <div class="ai-block-label">Dự báo</div>
                        <div class="ai-block-value"><i class="fa-solid fa-cloud-sun text-warning mr-2"></i>${aiResult.forecast}</div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                    <div class="ai-block" style="border-color: rgba(59,130,246,0.15); background: rgba(59,130,246,0.04);">
                        <div class="ai-block-label flex items-center gap-2"><i class="fa-solid fa-brain"></i> Đánh giá AI</div>
                        <div class="ai-block-value mt-1">${aiResult.summary}</div>
                    </div>
                    <div>
                        <div class="ai-block-label mb-2 pl-1">Khuyến nghị</div>
                        ${recHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // ─── FIREBASE ───
    if (typeof firebase !== 'undefined') {
        const messaging = firebase.messaging();
        messaging.requestPermission()
            .then(() => {
                console.log("Notification permission granted.");
                return messaging.getToken();
            })
            .then(token => {
                console.log("FCM Token:", token);
            })
            .catch(err => {
                console.log("Permission denied", err);
            });

        messaging.onMessage((payload) => {
            console.log("Message received. ", payload);
            alert(`[Cảnh báo] ${payload.notification.title}\n${payload.notification.body}`);
        });
    }
});

// ─── FORCE AI ───
window.forceAI = function() {
    const btn = document.getElementById('btn-force-ai');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang phân tích...';
        btn.disabled = true;
    }

    fetch('/api/force-ai')
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                alert('Lỗi AI: Vui lòng kiểm tra API Key!');
                if (btn) {
                    btn.innerHTML = '<i class="fa-solid fa-arrow-rotate-right"></i> Làm mới';
                    btn.disabled = false;
                }
            }
        })
        .catch(err => {
            console.error(err);
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-arrow-rotate-right"></i> Làm mới';
                btn.disabled = false;
            }
            alert('Lỗi kết nối AI!');
        });
}
