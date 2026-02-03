// 汇率监控 Dashboard - 主逻辑
// 全局变量
let historicalData = null;
let currentChart = null;
let selectedBaseCurrency = 'SGD';
let selectedTargetCurrency = 'CNY';
let selectedTimeRange = 365;

const CURRENCIES = ['USD', 'CNY', 'SGD', 'JPY', 'AUD'];

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard 初始化...');

    // 加载数据
    await loadData();

    // 设置事件监听
    setupEventListeners();

    // 初始化目标货币选项（确保与基础货币一致）
    updateTargetCurrencyOptions();

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
    document.getElementById('base-currency-select').addEventListener('change', (e) => {
        selectedBaseCurrency = e.target.value;
        updateTargetCurrencyOptions();
        updateDashboard();
    });

    document.getElementById('currency-select').addEventListener('change', (e) => {
        selectedTargetCurrency = e.target.value;
        updateDashboard();
    });

    document.getElementById('timerange-select').addEventListener('change', (e) => {
        selectedTimeRange = parseInt(e.target.value);
        updateDashboard();
    });
}

// 更新目标货币选项（排除基础货币）
function updateTargetCurrencyOptions() {
    const targetSelect = document.getElementById('currency-select');
    const currentValue = targetSelect.value;

    // 清空选项
    targetSelect.innerHTML = '';

    // 添加除基础货币外的所有货币
    CURRENCIES.forEach(curr => {
        if (curr !== selectedBaseCurrency) {
            const option = document.createElement('option');
            option.value = curr;
            option.textContent = getCurrencyLabel(curr);
            targetSelect.appendChild(option);
        }
    });

    // 尝试保持之前的选择，如果不可用则选择第一个
    if (currentValue !== selectedBaseCurrency && CURRENCIES.includes(currentValue)) {
        targetSelect.value = currentValue;
        selectedTargetCurrency = currentValue;
    } else {
        selectedTargetCurrency = targetSelect.value;
    }
}

// 获取货币标签
function getCurrencyLabel(currency) {
    const labels = {
        'USD': 'USD (美元)',
        'CNY': 'CNY (人民币)',
        'SGD': 'SGD (新加坡元)',
        'JPY': 'JPY (日元)',
        'AUD': 'AUD (澳元)'
    };
    return labels[currency] || currency;
}

// 计算货币对汇率（支持任意基础货币）
function getExchangeRate(baseRate, targetRate, base, target) {
    // 如果基础货币是 USD，直接返回目标货币汇率
    if (base === 'USD') {
        return targetRate;
    }
    // 如果目标货币是 USD，返回基础货币汇率的倒数
    if (target === 'USD') {
        return 1 / baseRate;
    }
    // 其他情况：通过 USD 作为中间货币转换
    // 例如：SGD/CNY = (USD/CNY) / (USD/SGD)
    return targetRate / baseRate;
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
    // 获取所有可能的货币对
    const pairs = CURRENCIES.filter(c => c !== selectedBaseCurrency);

    pairs.forEach((targetCurr, index) => {
        const stats = calculateStats(selectedBaseCurrency, targetCurr);
        const cardId = `stat-card-${index}`;

        // 更新或创建卡片
        let card = document.getElementById(cardId);
        if (!card) {
            // 如果卡片不存在，创建新的
            const grid = document.querySelector('.stats-grid');
            card = document.createElement('div');
            card.id = cardId;
            card.className = 'stat-card';
            grid.appendChild(card);
        }

        const pairName = `${selectedBaseCurrency}/${targetCurr}`;
        const changePercent = ((stats.current - stats.previous) / stats.previous * 100).toFixed(2);
        const changeSymbol = changePercent >= 0 ? '↑' : '↓';
        const deviation = Math.abs((stats.current - stats.mean) / stats.stdDev);

        // 设置卡片样式
        card.className = 'stat-card';
        if (deviation >= 2) {
            card.classList.add('alert');
        } else if (deviation >= 1.5) {
            card.classList.add('warning');
        }

        card.innerHTML = `
            <div class="stat-label">${pairName}</div>
            <div class="stat-value">${stats.current.toFixed(4)}</div>
            <div class="stat-change">${changeSymbol} ${Math.abs(changePercent)}%</div>
            <div class="stat-deviation">偏差: ${deviation.toFixed(2)}σ</div>
        `;
    });

    // 移除多余的卡片
    const grid = document.querySelector('.stats-grid');
    const allCards = grid.querySelectorAll('.stat-card');
    allCards.forEach((card, index) => {
        if (index >= pairs.length) {
            card.remove();
        }
    });
}

// 计算统计数据（支持任意货币对）
function calculateStats(baseCurr, targetCurr) {
    const data = historicalData.historical
        .slice(-selectedTimeRange)
        .map(d => {
            const baseRate = d.rates[baseCurr] || 1; // USD 的汇率是 1
            const targetRate = d.rates[targetCurr] || 1;
            return getExchangeRate(baseRate, targetRate, baseCurr, targetCurr);
        })
        .filter(v => v !== undefined && !isNaN(v));

    if (data.length === 0) {
        return { current: 0, previous: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const current = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : current;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);

    return { current, previous, mean, stdDev, min, max };
}

// 更新图表
function updateChart() {
    const chartData = prepareChartData(selectedBaseCurrency, selectedTargetCurrency);

    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('mainChart').getContext('2d');
    const pairName = `${selectedBaseCurrency}/${selectedTargetCurrency}`;

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: pairName,
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
function prepareChartData(baseCurr, targetCurr) {
    const stats = calculateStats(baseCurr, targetCurr);
    const data = historicalData.historical.slice(-selectedTimeRange);

    const labels = data.map(d => d.date);
    const values = data.map(d => {
        const baseRate = d.rates[baseCurr] || 1;
        const targetRate = d.rates[targetCurr] || 1;
        return getExchangeRate(baseRate, targetRate, baseCurr, targetCurr);
    });

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

// 更新统计信息
function updateStatistics() {
    const stats = calculateStats(selectedBaseCurrency, selectedTargetCurrency);
    const pairName = `${selectedBaseCurrency}/${selectedTargetCurrency}`;

    const statsHtml = `
        <div class="stat-item">
            <div class="stat-item-label">货币对</div>
            <div class="stat-item-value">${pairName}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">当前汇率</div>
            <div class="stat-item-value">${stats.current.toFixed(4)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">平均值</div>
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
    `;

    document.getElementById('statistics').innerHTML = statsHtml;
}

// 更新最后更新时间
function updateLastUpdateTime() {
    if (historicalData && historicalData.metadata) {
        const lastUpdate = historicalData.metadata.last_updated;
        const date = new Date(lastUpdate);
        document.getElementById('last-update').textContent = date.toLocaleString('zh-CN');
    }
}
