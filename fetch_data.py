#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Currency Exchange Rate Data Fetcher
使用GitHub免费API获取历史汇率数据
API: https://github.com/fawazahmed0/currency-api
"""

import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
import time

# 配置
CURRENCIES = ['cny', 'sgd', 'jpy', 'aud']  # 相对于USD的汇率
BASE_CURRENCY = 'usd'
DAYS_HISTORY = 365  # 先获取1年数据测试，成功后可改为1825（5年）

# API配置 - GitHub免费API
API_BASE_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1"

def fetch_url(url, timeout=10):
    """获取URL内容"""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            data = response.read()
            return json.loads(data.decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"网络错误: {e}")
        return None
    except Exception as e:
        print(f"解析错误: {e}")
        return None

def fetch_historical_rate(date):
    """
    获取指定日期的汇率数据

    Args:
        date: 日期字符串 (YYYY-MM-DD)

    Returns:
        dict: 汇率数据
    """
    url = f"{API_BASE_URL}/currencies/{BASE_CURRENCY}/{date}.json"

    data = fetch_url(url)

    if data and BASE_CURRENCY in data:
        rates = data[BASE_CURRENCY]
        # 只保留我们需要的货币
        filtered_rates = {k.upper(): v for k, v in rates.items() if k in CURRENCIES}

        return {
            'date': date,
            'base': BASE_CURRENCY.upper(),
            'rates': filtered_rates
        }

    return None

def fetch_current_rate():
    """获取当前最新汇率"""
    url = f"{API_BASE_URL}/currencies/{BASE_CURRENCY}.json"

    data = fetch_url(url)

    if data and BASE_CURRENCY in data:
        rates = data[BASE_CURRENCY]
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))

        filtered_rates = {k.upper(): v for k, v in rates.items() if k in CURRENCIES}

        return {
            'date': date,
            'base': BASE_CURRENCY.upper(),
            'rates': filtered_rates
        }

    return None

def generate_date_list(days=365):
    """生成过去N天的日期列表"""
    dates = []
    today = datetime.now()

    for i in range(days, -1, -1):
        date = today - timedelta(days=i)
        dates.append(date.strftime('%Y-%m-%d'))

    return dates

def fetch_all_historical_data(days=365):
    """获取所有历史数据"""
    print(f"开始获取过去{days}天的汇率数据...")
    print(f"基准货币: {BASE_CURRENCY.upper()}")
    print(f"目标货币: {', '.join([c.upper() for c in CURRENCIES])}")
    print("-" * 50)

    dates = generate_date_list(days)
    historical_data = []

    total = len(dates)
    success_count = 0
    fail_count = 0

    for idx, date in enumerate(dates, 1):
        # 显示进度
        if idx % 50 == 0 or idx == total:
            print(f"进度: {idx}/{total} ({idx/total*100:.1f}%)")

        data = fetch_historical_rate(date)

        if data:
            historical_data.append(data)
            success_count += 1
        else:
            fail_count += 1

        # 避免请求过快
        if idx % 10 == 0:
            time.sleep(0.3)

    print("-" * 50)
    print(f"完成！成功: {success_count}, 失败: {fail_count}")

    return historical_data

def save_to_json(data, filename='data/historical.json'):
    """保存数据到JSON文件"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"数据已保存到: {filename}")
        return True
    except Exception as e:
        print(f"保存文件失败: {e}")
        return False

def main():
    """主函数"""
    print("=" * 50)
    print("汇率数据获取工具")
    print("=" * 50)
    print()

    # 获取历史数据
    historical_data = fetch_all_historical_data(days=DAYS_HISTORY)

    if not historical_data:
        print("错误：未能获取任何历史数据")
        return

    # 获取当前汇率
    print("\n获取当前最新汇率...")
    current_data = fetch_current_rate()

    # 组合数据
    output_data = {
        'metadata': {
            'base_currency': BASE_CURRENCY.upper(),
            'currencies': [c.upper() for c in CURRENCIES],
            'total_days': len(historical_data),
            'start_date': historical_data[0]['date'] if historical_data else None,
            'end_date': historical_data[-1]['date'] if historical_data else None,
            'last_updated': datetime.now().isoformat(),
        },
        'current': current_data,
        'historical': historical_data
    }

    # 保存数据
    print("\n保存数据...")
    if save_to_json(output_data):
        print("\n✅ 所有数据获取完成！")
        print(f"总共获取了 {len(historical_data)} 天的数据")
    else:
        print("\n❌ 数据保存失败")

if __name__ == "__main__":
    main()
