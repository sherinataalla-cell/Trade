// EAR Trader Simulator - Frontend Logic

const API_URL = 'http://localhost:5000/api';
let currentSymbol = 'BTC';
let marketData = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupMarketButtons();
    setupTradeForm();
    loadDashboard();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (document.querySelector('.tab-content.active').id === 'dashboard') {
            loadDashboard();
        }
    }, 30000);
});

// Tab switching
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
            
            // Load content for the tab
            switch(tabName) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'trade':
                    loadTradePanel();
                    break;
                case 'analysis':
                    loadAnalysis(currentSymbol);
                    break;
                case 'history':
                    loadHistory();
                    break;
            }
        });
    });
}

// Market button switching
function setupMarketButtons() {
    document.querySelectorAll('.market-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSymbol = btn.dataset.symbol;
            document.querySelectorAll('.market-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadMarketData(currentSymbol);
        });
    });
    
    document.querySelectorAll('.analysis-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSymbol = btn.dataset.symbol;
            document.querySelectorAll('.analysis-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadAnalysis(currentSymbol);
        });
    });
}

// Load Dashboard
async function loadDashboard() {
    await loadPortfolio();
    await loadMarketData(currentSymbol);
}

// Load Portfolio
async function loadPortfolio() {
    try {
        const response = await fetch(`${API_URL}/portfolio`);
        const data = await response.json();
        
        const portfolioHTML = data.portfolio.map(item => {
            if (item.asset === 'USD') {
                return `
                    <div class="portfolio-item">
                        <div>
                            <div class="asset-name">💵 ${item.asset}</div>
                            <div class="asset-amount">Cash disponibile</div>
                        </div>
                        <div class="asset-value">
                            <div>$${item.value.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            } else {
                const pnlClass = item.pnl >= 0 ? 'positive' : 'negative';
                const pnlSign = item.pnl >= 0 ? '+' : '';
                return `
                    <div class="portfolio-item">
                        <div>
                            <div class="asset-name">🪙 ${item.asset}</div>
                            <div class="asset-amount">${item.amount.toFixed(4)} @ $${item.avg_price.toFixed(2)}</div>
                        </div>
                        <div class="asset-value">
                            <div>$${item.value.toFixed(2)}</div>
                            <div class="pnl ${pnlClass}">${pnlSign}${item.pnl.toFixed(2)}%</div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        const initialValue = 50000;
        const currentValue = data.total_value;
        const totalPnl = ((currentValue - initialValue) / initialValue * 100);
        const totalPnlClass = totalPnl >= 0 ? 'positive' : 'negative';
        const totalPnlSign = totalPnl >= 0 ? '+' : '';
        
        document.getElementById('portfolio-content').innerHTML = `
            ${portfolioHTML}
            <div class="portfolio-total">
                Total: $${currentValue.toFixed(2)} 
                <span class="pnl ${totalPnlClass}">(${totalPnlSign}${totalPnl.toFixed(2)}%)</span>
            </div>
        `;
    } catch (error) {
        document.getElementById('portfolio-content').innerHTML = `
            <div class="alert alert-error">⚠️ Errore caricamento portfolio</div>
        `;
    }
}

// Load Market Data
async function loadMarketData(symbol) {
    try {
        const response = await fetch(`${API_URL}/market/${symbol}`);
        const data = await response.json();
        marketData[symbol] = data;
        
        const priceChange = data.price_history && data.price_history.length > 1 
            ? ((data.current_price - data.price_history[0].price) / data.price_history[0].price * 100)
            : 0;
        const priceChangeClass = priceChange >= 0 ? 'positive' : 'negative';
        const priceChangeSign = priceChange >= 0 ? '+' : '';
        
        // Update market info
        document.getElementById('market-content').innerHTML = `
            <div class="market-info">
                <div class="current-price">$${data.current_price.toLocaleString()}</div>
                <div class="price-change ${priceChangeClass}">
                    ${priceChangeSign}${priceChange.toFixed(2)}%
                </div>
            </div>
        `;
        
        // Update EAR indicators
        updateEARIndicators(data);
        
        // Update recommendation
        updateRecommendation(data);
        
    } catch (error) {
        document.getElementById('market-content').innerHTML = `
            <div class="alert alert-error">⚠️ Errore caricamento dati</div>
        `;
    }
}

// Update EAR Indicators
function updateEARIndicators(data) {
    const epiPercent = data.epi * 100;
    const eciPercent = data.eci * 100;
    const etbPercent = data.etb * 100;
    
    const epiStatus = data.epi > 0.75 ? 'TRENDING FORTE' : 
                      data.epi > 0.65 ? 'TRENDING' : 
                      data.epi > 0.55 ? 'TRANSIZIONE' : 'RANGING';
    
    const eciStatus = data.eci > 0.8 ? 'CRITICO' : 
                      data.eci > 0.6 ? 'ATTENZIONE' : 'STABILE';
    
    const etbStatus = data.etb > 0.6 ? 'SANO' : 
                      data.etb > 0.4 ? 'MODERATO' : 'DEGRADATO';
    
    document.getElementById('ear-indicators-content').innerHTML = `
        <div class="indicator">
            <div class="indicator-label">
                <span>EPI (Hurst Exponent)</span>
                <span class="indicator-value">${data.epi.toFixed(3)}</span>
            </div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${epiPercent}%">
                    ${epiStatus}
                </div>
            </div>
            <div class="indicator-status">Persistenza: ${epiStatus}</div>
        </div>
        
        <div class="indicator">
            <div class="indicator-label">
                <span>ECI (Criticality Index)</span>
                <span class="indicator-value">${data.eci.toFixed(3)}</span>
            </div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${eciPercent}%">
                    ${eciStatus}
                </div>
            </div>
            <div class="indicator-status">Prossimità soglia: ${eciStatus}</div>
        </div>
        
        <div class="indicator">
            <div class="indicator-label">
                <span>ETB (Topology Balance)</span>
                <span class="indicator-value">${data.etb.toFixed(3)}</span>
            </div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${etbPercent}%">
                    ${etbStatus}
                </div>
            </div>
            <div class="indicator-status">Struttura: ${etbStatus}</div>
        </div>
        
        <div class="regime-display">
            <div class="regime-symbol">${data.regime}</div>
            <div class="regime-name">${getRegimeName(data.regime)}</div>
        </div>
    `;
}

// Update Recommendation
function updateRecommendation(data) {
    const rec = data.recommendation;
    const confidenceClass = `confidence-${rec.confidence.toLowerCase()}`;
    
    const rationaleHTML = rec.rationale.filter(r => r).map(r => 
        `<li>${r}</li>`
    ).join('');
    
    document.getElementById('recommendation-content').innerHTML = `
        <div class="recommendation-box">
            <div class="recommendation-action">${getActionLabel(rec.action)}</div>
            <span class="recommendation-confidence ${confidenceClass}">
                Confidenza: ${rec.confidence}
            </span>
            <h4>Rationale:</h4>
            <ul class="rationale-list">
                ${rationaleHTML}
            </ul>
        </div>
    `;
}

// Get regime friendly name
function getRegimeName(regime) {
    const names = {
        'Σ₂₃₂₊': 'Spirale (Trend Persistente)',
        'Σ₁₃₁₊': 'Avanzamento (Early Trend)',
        'Σ₃₃₁₊': 'Espansione (Exhaustion)',
        'Σ₁₁₁₋': 'Continuità (Ranging)',
        'Σ₄₁₃₊': 'Evento (Pre-Breakout)',
        'Σ₃₃₃₋': 'Dissoluzione (Breakdown)',
        'Σ₁₂₃₊': 'Transizione (Incerto)'
    };
    return names[regime] || regime;
}

// Get action label
function getActionLabel(action) {
    const labels = {
        'ENTER_LONG': '🟢 ENTRA LONG',
        'EXIT': '🔴 ESCI',
        'HOLD': '⏸️ MANTIENI',
        'WAIT': '⏳ ASPETTA',
        'REDUCE_50%': '⚠️ RIDUCI 50%',
        'PREPARE_BREAKOUT': '⚡ PREPARATI BREAKOUT'
    };
    return labels[action] || action;
}

// Setup Trade Form
function setupTradeForm() {
    const form = document.getElementById('trade-form');
    const assetSelect = document.getElementById('trade-asset');
    const amountInput = document.getElementById('trade-amount');
    
    // Update price when asset changes
    assetSelect.addEventListener('change', async () => {
        const symbol = assetSelect.value;
        await loadMarketData(symbol);
        updateTradeValue();
        updateTradeAssistant(symbol);
    });
    
    // Update value when amount changes
    amountInput.addEventListener('input', updateTradeValue);
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await executeTrade();
    });
}

// Update trade value display
function updateTradeValue() {
    const asset = document.getElementById('trade-asset').value;
    const amount = parseFloat(document.getElementById('trade-amount').value) || 0;
    
    if (marketData[asset]) {
        const value = amount * marketData[asset].current_price;
        document.getElementById('trade-value').textContent = `$${value.toFixed(2)}`;
    }
}

// Load Trade Panel
async function loadTradePanel() {
    const asset = document.getElementById('trade-asset').value;
    
    if (!marketData[asset]) {
        await loadMarketData(asset);
    }
    
    document.getElementById('current-price-display').value = 
        `$${marketData[asset].current_price.toLocaleString()}`;
    
    updateTradeAssistant(asset);
}

// Update Trade Assistant
function updateTradeAssistant(symbol) {
    const data = marketData[symbol];
    if (!data) return;
    
    const warnings = [];
    const checks = [];
    
    // Check EPI
    if (data.epi > 0.7) {
        checks.push('✓ EPI=' + data.epi.toFixed(2) + ' conferma trend');
    } else if (data.epi < 0.55) {
        warnings.push('⚠ EPI=' + data.epi.toFixed(2) + ' (ranging, no trend)');
    } else {
        checks.push('○ EPI=' + data.epi.toFixed(2) + ' (moderato)');
    }
    
    // Check ECI
    if (data.eci < 0.6) {
        checks.push('✓ ECI=' + data.eci.toFixed(2) + ' lontano da soglia');
    } else if (data.eci > 0.75) {
        warnings.push('⚠ ECI=' + data.eci.toFixed(2) + ' (soglia imminente)');
    } else {
        warnings.push('○ ECI=' + data.eci.toFixed(2) + ' (attenzione)');
    }
    
    // Check ETB
    if (data.etb > 0.6) {
        checks.push('✓ ETB=' + data.etb.toFixed(2) + ' struttura sana');
    } else if (data.etb < 0.4) {
        warnings.push('⚠ ETB=' + data.etb.toFixed(2) + ' (struttura degradata)');
    } else {
        checks.push('○ ETB=' + data.etb.toFixed(2) + ' (moderato)');
    }
    
    const allItems = [...checks, ...warnings];
    const html = allItems.map(item => {
        const icon = item.startsWith('✓') ? '✓' : 
                     item.startsWith('⚠') ? '⚠️' : '○';
        return `
            <div class="assistant-item">
                <span class="assistant-icon">${icon}</span>
                <span>${item.substring(2)}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('trade-assistant-content').innerHTML = html || 
        'Nessuna informazione disponibile';
}

// Execute Trade
async function executeTrade() {
    const asset = document.getElementById('trade-asset').value;
    const direction = document.querySelector('input[name="direction"]:checked').value;
    const amount = parseFloat(document.getElementById('trade-amount').value);
    const price = marketData[asset].current_price;
    
    try {
        const response = await fetch(`${API_URL}/trade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                asset,
                type: direction,
                amount,
                price
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('success', `✓ Trade eseguito: ${direction} ${amount} ${asset}`);
            loadPortfolio();
            
            // Reset form
            document.getElementById('trade-form').reset();
            document.getElementById('trade-value').textContent = '$0';
        } else {
            showAlert('error', '⚠️ ' + (result.error || 'Errore esecuzione trade'));
        }
    } catch (error) {
        showAlert('error', '⚠️ Errore comunicazione con server');
    }
}

// Show alert
function showAlert(type, message) {
    const alertClass = `alert-${type}`;
    const alertHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
    
    const container = document.querySelector('.tab-content.active');
    container.insertAdjacentHTML('afterbegin', alertHTML);
    
    setTimeout(() => {
        document.querySelector('.alert').remove();
    }, 5000);
}

// Load Analysis
async function loadAnalysis(symbol) {
    document.getElementById('deep-analysis-content').innerHTML = 
        '<div class="loading">Caricamento analisi approfondita...</div>';
    
    if (!marketData[symbol]) {
        await loadMarketData(symbol);
    }
    
    const data = marketData[symbol];
    
    // Create EPI trend chart (simple ASCII-like visualization)
    const epiTrend = generateTrendVisualization(data);
    
    document.getElementById('deep-analysis-content').innerHTML = `
        <div class="analysis-section">
            <h3>📊 EPI Trend (30 giorni)</h3>
            <pre style="background: #f8f8f8; padding: 20px; border-radius: 8px; overflow-x: auto;">
${epiTrend}
            </pre>
            ${data.epi > 0.82 ? '<div class="alert alert-warning">⚠️ EPI vicino a zona exhaustion (0.85)</div>' : ''}
        </div>
        
        <div class="analysis-section">
            <h3>🎯 Criticality Index (ECI)</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Corrente</div>
                    <div class="stat-value">${data.eci.toFixed(3)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Soglia</div>
                    <div class="stat-value">0.800</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Distanza</div>
                    <div class="stat-value ${data.eci < 0.6 ? 'positive' : 'negative'}">
                        ${(0.8 - data.eci).toFixed(3)}
                    </div>
                </div>
            </div>
            ${data.eci > 0.75 ? '<div class="alert alert-warning">⚠️ Sistema vicino a soglia critica</div>' : 
              '<div class="alert alert-success">✓ Sistema stabile, lontano da soglia</div>'}
        </div>
        
        <div class="analysis-section">
            <h3>🔗 Topology Balance (ETB)</h3>
            <div class="indicator">
                <div class="indicator-label">
                    <span>Tree (Gerarchia)</span>
                    <span>~35%</span>
                </div>
                <div class="indicator-bar">
                    <div class="indicator-fill" style="width: 35%"></div>
                </div>
            </div>
            <div class="indicator">
                <div class="indicator-label">
                    <span>Lattice (Rete)</span>
                    <span>~38%</span>
                </div>
                <div class="indicator-bar">
                    <div class="indicator-fill" style="width: 38%"></div>
                </div>
            </div>
            <div class="indicator">
                <div class="indicator-label">
                    <span>Loop (Cicli)</span>
                    <span>~27%</span>
                </div>
                <div class="indicator-bar">
                    <div class="indicator-fill" style="width: 27%"></div>
                </div>
            </div>
            ${data.etb > 0.6 ? '<div class="alert alert-success">✓ Struttura bilanciata supporta trend</div>' : 
              '<div class="alert alert-warning">⚠️ Struttura non ottimale</div>'}
        </div>
    `;
}

// Generate trend visualization
function generateTrendVisualization(data) {
    const levels = [0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50];
    const width = 60;
    
    // Simulate trend (in real app, would use historical data)
    const currentEPI = data.epi;
    const points = 10;
    const trendData = Array.from({length: points}, (_, i) => {
        const variance = (Math.random() - 0.5) * 0.05;
        return Math.max(0.5, Math.min(0.85, currentEPI - (points - i - 1) * 0.01 + variance));
    });
    
    let chart = '';
    levels.forEach(level => {
        let line = level.toFixed(2) + ' │';
        
        for (let i = 0; i < points; i++) {
            const val = trendData[i];
            if (Math.abs(val - level) < 0.025) {
                line += '●───';
            } else if (val > level) {
                line += '    ';
            } else {
                line += '────';
            }
        }
        
        chart += line + '\n';
    });
    
    chart += '     └' + '─'.repeat(width - 5) + '\n';
    chart += '      ' + Array.from({length: points}, (_, i) => 
        i % 2 === 0 ? `${points - i}d  ` : '    ').join('');
    
    return chart;
}

// Load History
async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/trades/history`);
        const data = await response.json();
        
        // Statistics
        const stats = data.statistics;
        document.getElementById('history-stats').innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Trade</div>
                <div class="stat-value">${stats.total_trades}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Win Rate</div>
                <div class="stat-value ${stats.win_rate > 55 ? 'positive' : ''}">${stats.win_rate.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Win</div>
                <div class="stat-value positive">+${stats.avg_win.toFixed(2)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Loss</div>
                <div class="stat-value negative">${stats.avg_loss.toFixed(2)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Sharpe Ratio</div>
                <div class="stat-value ${stats.sharpe_ratio > 1.5 ? 'positive' : ''}">${stats.sharpe_ratio.toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Max Drawdown</div>
                <div class="stat-value negative">${stats.max_drawdown.toFixed(2)}%</div>
            </div>
        `;
        
        // Trade table
        if (data.trades.length === 0) {
            document.getElementById('history-table').innerHTML = `
                <div class="alert alert-warning">Nessun trade ancora eseguito</div>
            `;
        } else {
            const tableHTML = `
                <table class="trade-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Asset</th>
                            <th>Tipo</th>
                            <th>Entry</th>
                            <th>Exit</th>
                            <th>P/L</th>
                            <th>Regime</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.trades.map(trade => {
                            const date = new Date(trade.date).toLocaleDateString('it-IT');
                            const pnlClass = trade.pnl_percent >= 0 ? 'positive' : 'negative';
                            const pnlSign = trade.pnl_percent >= 0 ? '+' : '';
                            
                            return `
                                <tr>
                                    <td>${date}</td>
                                    <td>${trade.asset}</td>
                                    <td><span class="trade-type long">${trade.type}</span></td>
                                    <td>$${trade.entry_price.toFixed(2)}</td>
                                    <td>$${trade.exit_price.toFixed(2)}</td>
                                    <td class="pnl ${pnlClass}">${pnlSign}${trade.pnl_percent.toFixed(2)}%</td>
                                    <td>${trade.regime}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
            
            document.getElementById('history-table').innerHTML = tableHTML;
        }
    } catch (error) {
        document.getElementById('history-stats').innerHTML = `
            <div class="alert alert-error">⚠️ Errore caricamento storico</div>
        `;
    }
}
