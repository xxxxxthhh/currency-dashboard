#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
获取真实汇率数据并追加到历史记录
使用 ExchangeRate-API 开放端点（无需API key）
"""

import json
import urllib.request
from datetime import datetime
import os

# 配置
API_URL = "https://open.exchangerate-api.com/v6/latest"
DATA_FILE = "data/historical.json"
CURRENCIES = ['CNY', 'SGD', 'JPY', 'AUD']

def fetch_current_rates():
    """获取当前汇率"""
    try:
        with urllib.request.urlopen(API_URL, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))

        rates = data.get('rates', {})
        base = data.get('base', 'USD')

        # 提取我们需要的货币
        filtered_rates = {curr: rates[curr] for curr in CURRENCIES if curr in rates}

        return {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'base': base,
            'rates': filtered_rates
        }
    except Exception as e:
        print(f"获取汇率失败: {e}")
        return None

def load_historical_data():
    """加载现有历史数据"""
    if not os.path.exists(DATA_FILE):
        return None

    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载历史数据失败: {e}")
        return None

def save_data(data):
    """保存数据"""
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存数据失败: {e}")
        return False

def main():
    print("=" * 50)
    print("获取真实汇率数据")
    print("=" * 50)

    # 获取当前汇率
    print("\n获取当前汇率...")
    current = fetch_current_rates()

    if not current:
        print("❌ 获取失败")
        return

    print(f"✅ 获取成功: {current['date']}")
    for curr, rate in current['rates'].items():
        print(f"  USD/{curr}: {rate}")

    # 加载历史数据
    print("\n加载历史数据...")
    data = load_historical_data()

    if data:
        print(f"✅ 已有 {len(data['historical'])} 天数据")

        # 检查今天是否已有数据
        today = current['date']
        if data['historical'] and data['historical'][-1]['date'] == today:
            print(f"⚠️  今天的数据已存在，更新...")
            data['historical'][-1] = current
        else:
            print("➕ 追加新数据...")
            data['historical'].append(current)

        # 更新元数据
        data['metadata']['total_days'] = len(data['historical'])
        data['metadata']['end_date'] = data['historical'][-1]['date']
        data['metadata']['last_updated'] = datetime.now().isoformat()
        data['current'] = current
    else:
        print("📝 创建新数据文件...")
        data = {
            'metadata': {
                'base_currency': 'USD',
                'currencies': CURRENCIES,
                'total_days': 1,
                'start_date': current['date'],
                'end_date': current['date'],
                'last_updated': datetime.now().isoformat()
            },
            'current': current,
            'historical': [current]
        }

    # 保存数据
    print("\n保存数据...")
    if save_data(data):
        print(f"✅ 成功！总共 {len(data['historical'])} 天数据")
    else:
        print("❌ 保存失败")

if __name__ == "__main__":
    main()
