#!/usr/bin/env python3
"""
EAR Trader Simulator - Main Backend
Paper trading application with EAR framework analysis
"""

import json
import sqlite3
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import pandas as pd
import requests
from typing import Dict, List, Tuple

app = Flask(__name__)
CORS(app)

# Database setup
DB_PATH = 'data/trades.db'

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Portfolio table
    c.execute('''CREATE TABLE IF NOT EXISTS portfolio
                 (id INTEGER PRIMARY KEY, 
                  asset TEXT, 
                  amount REAL, 
                  avg_price REAL,
                  updated_at TIMESTAMP)''')
    
    # Trades table
    c.execute('''CREATE TABLE IF NOT EXISTS trades
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  date TIMESTAMP,
                  asset TEXT,
                  type TEXT,
                  entry_price REAL,
                  exit_price REAL,
                  amount REAL,
                  pnl_percent REAL,
                  regime TEXT,
                  epi REAL,
                  eci REAL,
                  etb REAL,
                  notes TEXT)''')
    
    # Initial cash position
    c.execute("SELECT COUNT(*) FROM portfolio WHERE asset='USD'")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO portfolio VALUES (1, 'USD', 50000, 1, ?)", 
                  (datetime.now(),))
    
    conn.commit()
    conn.close()

# EAR Calculations
class EAREngine:
    """Core EAR analysis engine"""
    
    @staticmethod
    def calculate_hurst_exponent(prices: np.ndarray, max_lag: int = 20) -> float:
        """
        Calculate Hurst exponent using R/S analysis with robust fallback
        H ≈ 0.5: Random walk
        H > 0.5: Persistent (trending)
        H < 0.5: Anti-persistent (mean-reverting)
        """
        try:
            if len(prices) < 30:
                return 0.5
            
            lags = range(2, min(max_lag, len(prices)//2))
            tau = []
            
            for lag in lags:
                std = np.std(prices)
                if std == 0:
                    continue
                
                mean = np.mean(prices)
                Y = np.cumsum(prices - mean)
                R = np.max(Y) - np.min(Y)
                
                if R > 0 and std > 0:
                    RS = R / std
                    if RS > 0:
                        tau.append([np.log(lag), np.log(RS)])
            
            if len(tau) < 2:
                # Fallback: autocorrelation method
                returns = np.diff(prices) / prices[:-1]
                if len(returns) > 2:
                    mean_ret = np.mean(returns)
                    autocorr = np.corrcoef(returns[:-1], returns[1:])[0, 1]
                    if not np.isnan(autocorr):
                        return float(np.clip(0.5 + autocorr * 0.25, 0.3, 0.85))
                return 0.5
            
            tau = np.array(tau)
            poly = np.polyfit(tau[:, 0], tau[:, 1], 1)
            hurst = float(poly[0])
            return np.clip(hurst, 0.3, 0.9)
            
        except Exception:
            return 0.5
    
    @staticmethod
    def calculate_eci(prices: np.ndarray, volumes: np.ndarray = None) -> float:
        """
        Calculate EAR Criticality Index (ECI)
        Measures proximity to critical threshold
        ECI > 0.8: Near threshold (transition imminent)
        ECI < 0.5: Stable
        """
        if len(prices) < 30:
            return 0.0
            
        # Component 1: Volatility compression
        short_vol = np.std(prices[-30:])
        long_vol = np.std(prices[-365:] if len(prices) >= 365 else prices)
        vol_compression = short_vol / long_vol if long_vol != 0 else 1.0
        
        # Component 2: Correlation instability (rolling correlation variance)
        if len(prices) >= 100:
            window = 20
            rolling_corrs = []
            for i in range(window, len(prices) - window):
                subset = prices[i-window:i+window]
                corr = np.corrcoef(subset[:-1], subset[1:])[0, 1]
                rolling_corrs.append(corr)
            corr_instability = np.std(rolling_corrs) if rolling_corrs else 0.0
        else:
            corr_instability = 0.0
        
        # Component 3: Price momentum divergence
        if len(prices) >= 50:
            short_momentum = (prices[-1] - prices[-10]) / prices[-10]
            long_momentum = (prices[-1] - prices[-50]) / prices[-50]
            momentum_div = abs(short_momentum - long_momentum)
        else:
            momentum_div = 0.0
        
        # Weighted combination
        eci = (0.4 * vol_compression + 
               0.3 * corr_instability * 10 +  # Scale up
               0.3 * momentum_div * 5)  # Scale up
        
        return min(max(eci, 0.0), 1.0)  # Clamp to [0, 1]
    
    @staticmethod
    def calculate_etb(prices: np.ndarray) -> float:
        """
        Calculate EAR Topology Balance (ETB)
        Measures structural health of the system
        ETB > 0.6: Healthy balanced structure
        ETB < 0.4: Degraded structure
        
        For price data, we approximate topology from:
        - Tree: trend consistency (hierarchy)
        - Lattice: mean reversion (network)
        - Loop: cyclical patterns (feedback)
        """
        if len(prices) < 50:
            return 0.5
            
        # Tree score: trend consistency
        returns = np.diff(prices) / prices[:-1]
        trend_consistency = abs(np.mean(returns) / np.std(returns)) if np.std(returns) != 0 else 0
        tree_score = min(trend_consistency * 0.3, 0.5)
        
        # Lattice score: mean reversion strength
        mean_price = np.mean(prices)
        deviations = abs(prices - mean_price) / mean_price
        mean_reversion = 1 - np.mean(deviations)
        lattice_score = max(mean_reversion * 0.5, 0.2)
        
        # Loop score: cyclical pattern (simple autocorrelation)
        if len(prices) >= 100:
            lag = 20
            autocorr = np.corrcoef(prices[:-lag], prices[lag:])[0, 1]
            loop_score = abs(autocorr) * 0.3
        else:
            loop_score = 0.2
        
        # Balance: ideally each component ~33%
        total = tree_score + lattice_score + loop_score
        if total == 0:
            return 0.5
            
        # Normalized scores
        tree_norm = tree_score / total
        lattice_norm = lattice_score / total
        loop_norm = loop_score / total
        
        # ETB: how close to perfect balance (0.33, 0.33, 0.33)
        ideal = 1/3
        deviation = (abs(tree_norm - ideal) + 
                     abs(lattice_norm - ideal) + 
                     abs(loop_norm - ideal)) / 2
        
        etb = 1 - deviation
        return max(min(etb, 1.0), 0.0)
    
    @staticmethod
    def classify_regime(epi: float, eci: float, etb: float) -> str:
        """
        Classify market regime using EAR framework
        Returns symbol notation (e.g., Σ₂₃₂₊)
        """
        # Simplified regime classification
        if epi > 0.75 and eci < 0.6:
            return "Σ₂₃₂₊"  # Spirale - Strong trend
        elif epi > 0.65 and eci < 0.5:
            return "Σ₂₃₂₊"  # Spirale - Moderate trend
        elif epi > 0.75 and eci > 0.75:
            return "Σ₃₃₁₊"  # Espansione - Exhaustion
        elif epi < 0.55:
            return "Σ₁₁₁₋"  # Continuità - Ranging
        elif eci > 0.75:
            return "Σ₄₁₃₊"  # Evento - Breakout imminent
        elif epi > 0.6 and eci < 0.5:
            return "Σ₁₃₁₊"  # Avanzamento - Early trend
        elif etb < 0.4:
            return "Σ₃₃₃₋"  # Dissoluzione - Structure breakdown
        else:
            return "Σ₁₂₃₊"  # Transizione - Uncertain
    
    @staticmethod
    def get_recommendation(epi: float, eci: float, etb: float, 
                          regime: str, current_position: str = None) -> Dict:
        """Generate trading recommendation based on EAR indicators"""
        
        # Default: no position
        if current_position is None:
            if regime in ["Σ₂₃₂₊", "Σ₁₃₁₊"] and eci < 0.6 and etb > 0.5:
                return {
                    "action": "ENTER_LONG",
                    "confidence": "HIGH",
                    "rationale": [
                        f"EPI={epi:.2f} confirms persistence",
                        f"ECI={eci:.2f} safe from threshold",
                        f"ETB={etb:.2f} structure healthy"
                    ]
                }
            elif regime == "Σ₄₁₃₊" and eci > 0.75:
                return {
                    "action": "PREPARE_BREAKOUT",
                    "confidence": "MEDIUM",
                    "rationale": [
                        f"ECI={eci:.2f} near threshold",
                        "Breakout imminent (direction uncertain)"
                    ]
                }
            else:
                return {
                    "action": "WAIT",
                    "confidence": "HIGH",
                    "rationale": [
                        f"Regime {regime} not favorable for entry"
                    ]
                }
        
        # Has long position
        elif current_position == "LONG":
            if epi > 0.85 or eci > 0.8:
                return {
                    "action": "EXIT",
                    "confidence": "HIGH",
                    "rationale": [
                        f"EPI={epi:.2f} exhaustion zone" if epi > 0.85 else "",
                        f"ECI={eci:.2f} threshold approaching" if eci > 0.8 else ""
                    ]
                }
            elif etb < 0.4:
                return {
                    "action": "REDUCE_50%",
                    "confidence": "MEDIUM",
                    "rationale": [
                        f"ETB={etb:.2f} structure degrading"
                    ]
                }
            else:
                return {
                    "action": "HOLD",
                    "confidence": "HIGH",
                    "rationale": [
                        f"EPI={epi:.2f} trend intact",
                        f"ECI={eci:.2f} stable",
                        f"ETB={etb:.2f} healthy"
                    ]
                }
        
        return {"action": "HOLD", "confidence": "MEDIUM", "rationale": ["Default"]}

# Data fetching
class DataFetcher:
    """Fetch real market data from public APIs"""
    
    COINGECKO_BASE = "https://api.coingecko.com/api/v3"
    
    @staticmethod
    def get_current_price(symbol: str) -> float:
        """Get current price for symbol"""
        symbol_map = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana',
            'DOGE': 'dogecoin',
            'XRP': 'ripple'
        }
        
        coin_id = symbol_map.get(symbol.upper(), symbol.lower())
        
        try:
            url = f"{DataFetcher.COINGECKO_BASE}/simple/price"
            params = {'ids': coin_id, 'vs_currencies': 'usd'}
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            return data[coin_id]['usd']
        except:
            # Fallback mock data
            mock_prices = {'BTC': 42150, 'ETH': 2240, 'SOL': 98.5}
            return mock_prices.get(symbol.upper(), 100.0)
    
    @staticmethod
    def get_historical_prices(symbol: str, days: int = 365) -> pd.DataFrame:
        """Get historical OHLCV data"""
        symbol_map = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana'
        }
        
        coin_id = symbol_map.get(symbol.upper(), symbol.lower())
        
        try:
            url = f"{DataFetcher.COINGECKO_BASE}/coins/{coin_id}/market_chart"
            params = {'vs_currency': 'usd', 'days': days}
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            prices = data['prices']
            df = pd.DataFrame(prices, columns=['timestamp', 'price'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            print(f"Error fetching data: {e}")
            # Return mock data
            dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
            # Generate realistic-looking price data
            base = 40000 if symbol == 'BTC' else 2000
            noise = np.random.randn(days).cumsum() * (base * 0.01)
            prices = base + noise
            return pd.DataFrame({'timestamp': dates, 'price': prices})

# API Endpoints
@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    """Get current portfolio state"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT asset, amount, avg_price FROM portfolio")
    rows = c.fetchall()
    conn.close()
    
    portfolio = []
    total_value = 0
    
    for asset, amount, avg_price in rows:
        if asset == 'USD':
            portfolio.append({
                'asset': 'USD',
                'amount': amount,
                'value': amount,
                'pnl': 0
            })
            total_value += amount
        else:
            current_price = DataFetcher.get_current_price(asset)
            value = amount * current_price
            pnl = ((current_price - avg_price) / avg_price * 100) if avg_price > 0 else 0
            
            portfolio.append({
                'asset': asset,
                'amount': amount,
                'avg_price': avg_price,
                'current_price': current_price,
                'value': value,
                'pnl': pnl
            })
            total_value += value
    
    return jsonify({
        'portfolio': portfolio,
        'total_value': total_value
    })

@app.route('/api/market/<symbol>', methods=['GET'])
def get_market_data(symbol):
    """Get current market data and EAR analysis for symbol"""
    
    # Fetch data
    current_price = DataFetcher.get_current_price(symbol)
    hist_df = DataFetcher.get_historical_prices(symbol, days=365)
    prices = hist_df['price'].values
    
    # Calculate EAR indicators
    engine = EAREngine()
    epi = engine.calculate_hurst_exponent(prices[-100:])  # Last 100 days
    eci = engine.calculate_eci(prices)
    etb = engine.calculate_etb(prices[-100:])
    regime = engine.classify_regime(epi, eci, etb)
    
    # Get recommendation
    recommendation = engine.get_recommendation(epi, eci, etb, regime)
    
    return jsonify({
        'symbol': symbol,
        'current_price': current_price,
        'epi': round(epi, 3),
        'eci': round(eci, 3),
        'etb': round(etb, 3),
        'regime': regime,
        'recommendation': recommendation,
        'price_history': hist_df.tail(30).to_dict('records')
    })

@app.route('/api/trade', methods=['POST'])
def execute_trade():
    """Execute a paper trade"""
    data = request.json
    
    asset = data['asset']
    trade_type = data['type']  # 'BUY' or 'SELL'
    amount = float(data['amount'])
    price = float(data['price'])
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    if trade_type == 'BUY':
        # Check USD balance
        c.execute("SELECT amount FROM portfolio WHERE asset='USD'")
        usd_balance = c.fetchone()[0]
        
        cost = amount * price
        if cost > usd_balance:
            conn.close()
            return jsonify({'error': 'Insufficient USD balance'}), 400
        
        # Update USD
        c.execute("UPDATE portfolio SET amount = amount - ? WHERE asset='USD'", (cost,))
        
        # Update asset
        c.execute("SELECT amount, avg_price FROM portfolio WHERE asset=?", (asset,))
        row = c.fetchone()
        
        if row:
            old_amount, old_avg = row
            new_amount = old_amount + amount
            new_avg = ((old_amount * old_avg) + (amount * price)) / new_amount
            c.execute("UPDATE portfolio SET amount=?, avg_price=?, updated_at=? WHERE asset=?",
                     (new_amount, new_avg, datetime.now(), asset))
        else:
            c.execute("INSERT INTO portfolio VALUES (NULL, ?, ?, ?, ?)",
                     (asset, amount, price, datetime.now()))
    
    elif trade_type == 'SELL':
        # Check asset balance
        c.execute("SELECT amount, avg_price FROM portfolio WHERE asset=?", (asset,))
        row = c.fetchone()
        
        if not row or row[0] < amount:
            conn.close()
            return jsonify({'error': f'Insufficient {asset} balance'}), 400
        
        old_amount, avg_price = row
        proceeds = amount * price
        
        # Update asset
        new_amount = old_amount - amount
        if new_amount == 0:
            c.execute("DELETE FROM portfolio WHERE asset=?", (asset,))
        else:
            c.execute("UPDATE portfolio SET amount=?, updated_at=? WHERE asset=?",
                     (new_amount, datetime.now(), asset))
        
        # Update USD
        c.execute("UPDATE portfolio SET amount = amount + ? WHERE asset='USD'", (proceeds,))
        
        # Record trade for history
        pnl = ((price - avg_price) / avg_price * 100)
        
        # Get current EAR indicators
        hist_df = DataFetcher.get_historical_prices(asset)
        prices = hist_df['price'].values
        engine = EAREngine()
        epi = engine.calculate_hurst_exponent(prices[-100:])
        eci = engine.calculate_eci(prices)
        etb = engine.calculate_etb(prices[-100:])
        regime = engine.classify_regime(epi, eci, etb)
        
        c.execute("""INSERT INTO trades 
                     (date, asset, type, entry_price, exit_price, amount, pnl_percent, 
                      regime, epi, eci, etb, notes)
                     VALUES (?, ?, 'LONG', ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                  (datetime.now(), asset, avg_price, price, amount, pnl, 
                   regime, epi, eci, etb, f"Paper trade executed"))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': f'{trade_type} executed'})

@app.route('/api/trades/history', methods=['GET'])
def get_trade_history():
    """Get trade history with statistics"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("""SELECT date, asset, type, entry_price, exit_price, 
                        amount, pnl_percent, regime, epi, eci, etb
                 FROM trades 
                 ORDER BY date DESC 
                 LIMIT 50""")
    
    trades = []
    for row in c.fetchall():
        trades.append({
            'date': row[0],
            'asset': row[1],
            'type': row[2],
            'entry_price': row[3],
            'exit_price': row[4],
            'amount': row[5],
            'pnl_percent': row[6],
            'regime': row[7],
            'epi': row[8],
            'eci': row[9],
            'etb': row[10]
        })
    
    # Calculate statistics
    if trades:
        pnls = [t['pnl_percent'] for t in trades]
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p < 0]
        
        stats = {
            'total_trades': len(trades),
            'win_rate': len(wins) / len(trades) * 100 if trades else 0,
            'avg_win': np.mean(wins) if wins else 0,
            'avg_loss': np.mean(losses) if losses else 0,
            'sharpe_ratio': np.mean(pnls) / np.std(pnls) if len(pnls) > 1 and np.std(pnls) != 0 else 0,
            'max_drawdown': min(pnls) if pnls else 0
        }
    else:
        stats = {
            'total_trades': 0,
            'win_rate': 0,
            'avg_win': 0,
            'avg_loss': 0,
            'sharpe_ratio': 0,
            'max_drawdown': 0
        }
    
    conn.close()
    
    return jsonify({
        'trades': trades,
        'statistics': stats
    })

if __name__ == '__main__':
    init_db()
    print("🚀 EAR Trader Simulator Backend Starting...")
    print("📊 Access at: http://localhost:5000")
    app.run(debug=True, port=5000)
