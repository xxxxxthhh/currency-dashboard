# 💱 汇率监控 Dashboard

实时追踪货币汇率走势，自动检测均值偏离并发送预警。

## 🌟 功能特点

- **实时监控**：追踪 USD/CNY、USD/SGD、USD/JPY、USD/AUD 四个货币对
- **历史数据**：支持查看 30/90/180/365 天的历史走势
- **统计分析**：自动计算均值、标准差、波动率等指标
- **偏离预警**：
  - 偏离均值 > 1.5σ：黄色预警
  - 偏离均值 > 2σ：红色预警
- **可视化图表**：使用 Chart.js 绘制布林带图表
- **响应式设计**：支持手机、平板、电脑访问

## 📊 预览

Dashboard 包含：
- 4个实时汇率卡片（带预警颜色）
- 交互式历史走势图（布林带）
- 详细统计信息面板

## 🚀 快速开始

### 本地运行

1. 克隆仓库
```bash
git clone <your-repo-url>
cd currency-dashboard
```

2. 启动本地服务器
```bash
# 使用 Python
python3 -m http.server 8000

# 或使用 Node.js
npx serve
```

3. 打开浏览器访问 `http://localhost:8000`

### GitHub Pages 部署

1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 `main` 分支作为源
4. 访问 `https://<username>.github.io/<repo-name>/`

## 📁 项目结构

```
currency-dashboard/
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   └── main.js            # 主逻辑
├── data/
│   └── historical.json    # 历史数据
├── .github/
│   └── workflows/
│       └── update-data.yml # 自动更新数据
├── fetch_data.py          # 数据获取脚本
└── README.md              # 说明文档
```

## 🔧 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **图表库**：Chart.js 4.4.0
- **数据格式**：JSON
- **自动化**：GitHub Actions
- **部署**：GitHub Pages

## 📈 数据说明

当前使用模拟数据作为演示。实际部署时可以：

1. **使用免费API**：集成真实汇率API
2. **每日更新**：通过 GitHub Actions 自动更新
3. **逐步积累**：每天收集数据，建立历史记录

## ⚙️ 配置

### 修改监控货币

编辑 `js/main.js`：
```javascript
const currencies = ['CNY', 'SGD', 'JPY', 'AUD']; // 添加或删除货币
```

### 调整预警阈值

编辑 `js/main.js` 中的 `updateStatCards` 函数：
```javascript
if (Math.abs(deviation) > 2) {      // 红色预警阈值
    card.classList.add('alert');
} else if (Math.abs(deviation) > 1.5) {  // 黄色预警阈值
    card.classList.add('warning');
}
```

## 🔔 预警系统

预警系统会自动检测汇率偏离情况：

- **正常**：偏离 < 1.5σ（蓝色卡片）
- **警告**：1.5σ ≤ 偏离 < 2σ（黄色卡片）
- **警报**：偏离 ≥ 2σ（红色卡片，闪烁动画）

可以集成 WhatsApp 推送，在检测到异常时自动发送消息。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Chart.js](https://www.chartjs.org/) - 图表库
- [GitHub Pages](https://pages.github.com/) - 免费托管

---

**注意**：当前使用模拟数据作为演示。实际使用时请替换为真实的汇率数据源。
