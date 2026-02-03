#!/usr/bin/env python3
"""
Fetch real historical exchange rate data from fawazahmed0 API
Downloads data for the past 2 years (730 days)
"""

import urllib.request
import json
import time
from datetime import datetime, timedelta

# Configuration
CURRENCIES = ['CNY', 'SGD', 'JPY', 'AUD']
OUTPUT_FILE = 'data/historical.json'
DAYS_TO_FETCH = 730  # 2 years of data

def fetch_rate_for_date(date_str):
    """Fetch exchange rates for a specific date"""
    # Try the date-specific endpoint
    url = f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date_str}/v1/currencies/usd.json"

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            usd_rates = data.get('usd', {})

            # Extract our currencies
            rates = {}
            for curr in CURRENCIES:
                curr_lower = curr.lower()
                if curr_lower in usd_rates:
                    rates[curr] = usd_rates[curr_lower]

            if len(rates) == len(CURRENCIES):
                return {
                    'date': date_str,
                    'rates': rates
                }
            else:
                return None

    except Exception as e:
        print(f"  ⚠️  Failed for {date_str}: {e}")
        return None

def main():
    print("🔄 Starting historical data fetch...")
    print(f"📅 Fetching {DAYS_TO_FETCH} days of data")
    print(f"💱 Currencies: {', '.join(CURRENCIES)}\n")

    historical_data = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=DAYS_TO_FETCH)

    current_date = start_date
    success_count = 0
    fail_count = 0

    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')

        # Progress indicator
        if (current_date - start_date).days % 50 == 0:
            progress = ((current_date - start_date).days / DAYS_TO_FETCH) * 100
            print(f"📊 Progress: {progress:.1f}% ({success_count} successful, {fail_count} failed)")

        result = fetch_rate_for_date(date_str)

        if result:
            historical_data.append(result)
            success_count += 1
        else:
            fail_count += 1

        current_date += timedelta(days=1)

        # Rate limiting - be nice to the API
        time.sleep(0.1)

    print(f"\n✅ Fetch complete!")
    print(f"   Success: {success_count} days")
    print(f"   Failed: {fail_count} days")

    # Get current rates for the "current" field
    print("\n🔄 Fetching current rates...")
    current_url = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"

    try:
        with urllib.request.urlopen(current_url, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            usd_rates = data.get('usd', {})

            current_rates = {}
            for curr in CURRENCIES:
                curr_lower = curr.lower()
                if curr_lower in usd_rates:
                    current_rates[curr] = usd_rates[curr_lower]

            current_data = {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'base': 'USD',
                'rates': current_rates
            }
            print("✅ Current rates fetched")
    except Exception as e:
        print(f"⚠️  Failed to fetch current rates: {e}")
        current_data = historical_data[-1] if historical_data else None

    # Build final JSON structure
    output = {
        'metadata': {
            'base': 'USD',
            'currencies': CURRENCIES,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'total_days': len(historical_data),
            'last_updated': datetime.now().isoformat()
        },
        'current': current_data,
        'historical': historical_data
    }

    # Save to file
    print(f"\n💾 Saving to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"✅ Done! Saved {len(historical_data)} days of historical data")
    print(f"📁 File: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
