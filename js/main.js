// 汇率监控 Dashboard - 主逻辑
// 全局变量
let historicalData = null;
let currentChart = null;
let selectedCurrency = 'CNY';
let selectedTimeRange = 365;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard 初始化...');

    // 加载数据
    await loadData();

    // 设置事件监听
    setupEventListeners();

    // 初始化显示
    updateDashboard();
});

// 加载数据
async function loadData() {
    try {
        const response = await fetch('data/historical.json');
        if (!response.ok) {
            throw new Error('数据加载失败');
        }
        historicalData = await response.json();
        console.log('数据加载成功:', historicalData.metadata);
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('数据加载失败，请刷新页面重试');
    }
}

// 设置事件监听
function setupEventListeners() {
    document.getElementById('currency-select').addEventListener('change', (e) => {
        selectedCurrency = e.target.value;
        updateDashboard();
    });

    document.getElementById('timerange-select').addEventListener('change', (e) => {
        selectedTimeRange = parseInt(e.target.value);
        updateDashboard();
    });
}

// 更新整个Dashboard
function updateDashboard() {
    if (!historicalData) return;

    updateStatCards();
    updateChart();
    updateStatistics();
    updateLastUpdateTime();
}


// 更新统计卡片
function updateStatCards() {
    const currencies = ['CNY', 'SGD', 'JPY', 'AUD'];
    
    currencies.forEach(currency => {
        const stats = calculateStats(currency);
        const card = document.getElementById(`stat-usd-${currency.toLowerCase()}`);
        
        if (!card || !stats) return;
        
        // 更新数值
        card.querySelector('.stat-value').textContent = stats.current.toFixed(4);
        
        // 更新涨跌
        const changeEl = card.querySelector('.stat-change');
        const changePercent = ((stats.current - stats.previous) / stats.previous * 100).toFixed(2);
        changeEl.textContent = `${changePercent > 0 ? '↑' : '↓'} ${Math.abs(changePercent)}%`;
        
        // 更新偏离度
        const deviationEl = card.querySelector('.stat-deviation');
        const deviation = ((stats.current - stats.mean) / stats.stdDev).toFixed(2);
        deviationEl.textContent = `偏离: ${deviation}σ`;
        
        // 设置预警样式
        card.classList.remove('warning', 'alert');
        if (Math.abs(deviation) > 2) {
            card.classList.add('alert');
        } else if (Math.abs(deviation) > 1.5) {
            card.classList.add('warning');
        }
    });
}

// 计算统计数据
function calculateStats(currency) {
    if (!historicalData) return null;
    
    const data = historicalData.historical
        .slice(-selectedTimeRange)
        .map(d => d.rates[currency])
        .filter(v => v !== undefined);
    
    if (data.length === 0) return null;
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2] || current;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return {
        current,
        previous,
        mean,
        stdDev,
        min: Math.min(...data),
        max: Math.max(...data)
    };
}


// 更新图表
function updateChart() {
    const stats = calculateStats(selectedCurrency);
    if (!stats) return;
    
    const chartData = prepareChartData(selectedCurrency);
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const ctx = document.getElementById('mainChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: `USD/${selectedCurrency}`,
                    data: chartData.values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '均值',
                    data: chartData.mean,
                    borderColor: '#48bb78',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: '均值 + 1σ',
                    data: chartData.upperBand1,
                    borderColor: '#f6ad55',
                    borderWidth: 1,
                    borderDash: [3, 3],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: '均值 - 1σ',
                    data: chartData.lowerBand1,
                    borderColor: '#f6ad55',
                    borderWidth: 1,
                    borderDash: [3, 3],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: '均值 + 2σ',
                    data: chartData.upperBand2,
                    borderColor: '#fc8181',
                    borderWidth: 1,
                    borderDash: [2, 2],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: '均值 - 2σ',
                    data: chartData.lowerBand2,
                    borderColor: '#fc8181',
                    borderWidth: 1,
                    borderDash: [2, 2],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: window.innerWidth < 768 ? 10 : 15,
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '汇率'
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        }
                    }
                }
            }
        }
    });
}

// 准备图表数据
function prepareChartData(currency) {
    const stats = calculateStats(currency);
    const data = historicalData.historical.slice(-selectedTimeRange);
    
    const labels = data.map(d => d.date);
    const values = data.map(d => d.rates[currency]);
    const mean = Array(values.length).fill(stats.mean);
    const upperBand1 = Array(values.length).fill(stats.mean + stats.stdDev);
    const lowerBand1 = Array(values.length).fill(stats.mean - stats.stdDev);
    const upperBand2 = Array(values.length).fill(stats.mean + 2 * stats.stdDev);
    const lowerBand2 = Array(values.length).fill(stats.mean - 2 * stats.stdDev);
    
    return {
        labels,
        values,
        mean,
        upperBand1,
        lowerBand1,
        upperBand2,
        lowerBand2
    };
}


// 更新统计信息区域
function updateStatistics() {
    const stats = calculateStats(selectedCurrency);
    if (!stats) return;
    
    const statsHtml = `
        <div class="stat-item">
            <div class="stat-item-label">当前汇率</div>
            <div class="stat-item-value">${stats.current.toFixed(4)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">均值</div>
            <div class="stat-item-value">${stats.mean.toFixed(4)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">标准差</div>
            <div class="stat-item-value">${stats.stdDev.toFixed(4)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">最高值</div>
            <div class="stat-item-value">${stats.max.toFixed(4)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">最低值</div>
            <div class="stat-item-value">${stats.min.toFixed(4)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">波动率</div>
            <div class="stat-item-value">${(stats.stdDev / stats.mean * 100).toFixed(2)}%</div>
        </div>
    `;
    
    document.getElementById('statistics').innerHTML = statsHtml;
}

// 更新最后更新时间
function updateLastUpdateTime() {
    if (!historicalData) return;
    
    const lastUpdate = new Date(historicalData.metadata.last_updated);
    document.getElementById('last-update').textContent = lastUpdate.toLocaleString('zh-CN');
}
