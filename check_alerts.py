#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
汇率偏离预警脚本
检测汇率是否偏离均值，并发送WhatsApp预警
"""

import json
import statistics
from datetime import datetime

# 配置
ALERT_THRESHOLD_SIGMA = 2.0  # 红色预警阈值
WARNING_THRESHOLD_SIGMA = 1.5  # 黄色预警阈值
DATA_FILE = 'data/historical.json'

def load_data():
    """加载历史数据"""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载数据失败: {e}")
        return None

def calculate_deviation(currency, data, days=365):
    """计算汇率偏离度"""
    historical = data['historical'][-days:]
    rates = [d['rates'][currency] for d in historical if currency in d['rates']]

    if len(rates) < 2:
        return None

    current = rates[-1]
    mean = statistics.mean(rates)
    stdev = statistics.stdev(rates)

    if stdev == 0:
        return None

    deviation = (current - mean) / stdev

    return {
        'currency': currency,
        'current': current,
        'mean': mean,
        'stdev': stdev,
        'deviation': deviation,
        'abs_deviation': abs(deviation)
    }

def check_alerts(data):
    """检查所有货币对的预警"""
    currencies = ['CNY', 'SGD', 'JPY', 'AUD']
    alerts = []

    for currency in currencies:
        result = calculate_deviation(currency, data)

        if not result:
            continue

        if result['abs_deviation'] >= ALERT_THRESHOLD_SIGMA:
            alerts.append({
                'level': 'ALERT',
                'currency': currency,
                'data': result
            })
        elif result['abs_deviation'] >= WARNING_THRESHOLD_SIGMA:
            alerts.append({
                'level': 'WARNING',
                'currency': currency,
                'data': result
            })

    return alerts

def format_alert_message(alerts):
    """格式化预警消息"""
    if not alerts:
        return None

    message = "⚠️ *汇率偏离预警*\n\n"

    for alert in alerts:
        level_emoji = "🔴" if alert['level'] == 'ALERT' else "🟡"
        data = alert['data']

        message += f"{level_emoji} *USD/{alert['currency']}*\n"
        message += f"当前: {data['current']:.4f}\n"
        message += f"均值: {data['mean']:.4f}\n"
        message += f"偏离: {data['deviation']:.2f}σ\n\n"

    message += f"_检查时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_"

    return message

def main():
    """主函数"""
    print("=" * 50)
    print("汇率偏离预警检查")
    print("=" * 50)

    # 加载数据
    data = load_data()
    if not data:
        print("无法加载数据")
        return

    # 检查预警
    alerts = check_alerts(data)

    if not alerts:
        print("✅ 所有货币对正常，无预警")
        return

    # 格式化消息
    message = format_alert_message(alerts)
    print("\n" + message)

    # 这里可以集成WhatsApp发送功能
    # 例如：send_whatsapp_message(message)

    print("\n" + "=" * 50)
    print(f"发现 {len(alerts)} 个预警")

if __name__ == "__main__":
    main()
