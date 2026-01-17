# 🎯 EAR Trader Simulator

**Paper Trading con Framework EAR Integrato**

Applicazione standalone per simulare trading di criptovalute con analisi basata sul framework EAR (Entità Autoriali Ricorsive).

---

## 📋 Caratteristiche

- ✅ **100% Locale**: Nessun account broker necessario
- ✅ **Analisi EAR**: Indicatori EPI, ECI, ETB integrati
- ✅ **Dati Reali**: Prezzi live da CoinGecko API
- ✅ **Paper Trading**: Simula trade senza rischi
- ✅ **Statistiche**: Track record completo con Sharpe ratio
- ✅ **Raccomandazioni**: Assistente AI basato su framework EAR

---

## 🚀 Installazione

### Requisiti
- Python 3.8+
- Browser moderno (Chrome, Firefox, Edge)

### Step 1: Download
```bash
# Clona o scarica i file in una cartella
cd ear-trader
```

### Step 2: Installa dipendenze Python
```bash
pip install -r requirements.txt
```

**Nota per Windows:** Se `pip` non funziona, usa:
```bash
python -m pip install -r requirements.txt
```

### Step 3: Crea cartella dati
```bash
mkdir data
```

---

## ▶️ Avvio Applicazione

### 🎯 METODO SEMPLICE (RACCOMANDATO)

#### Mac/Linux
```bash
./start_complete.sh
```
Poi apri browser su: **http://localhost:8000**

#### Windows  
```
Doppio click su: start_complete.bat
```
Poi apri browser su: **http://localhost:8000**

**Per fermare:**
- Mac/Linux: `./stop.sh`
- Windows: Doppio click su `stop.bat`

---

### 🔧 Metodo Manuale (2 Terminali)

Se il metodo automatico non funziona:

#### Terminale 1 - Backend
```bash
python3 main.py    # Mac/Linux
python main.py     # Windows
```
Lascia aperto! Deve mostrare: `Running on http://127.0.0.1:5000`

#### Terminale 2 - Frontend
```bash
cd app
python3 -m http.server 8000    # Mac/Linux
python -m http.server 8000     # Windows
```

#### Browser
Apri: **http://localhost:8000**



### 1. Avvia il Backend (Server Python)

**Su Mac/Linux:**
```bash
python3 main.py
```

**Su Windows:**
```bash
python main.py
```

Dovresti vedere:
```
🚀 EAR Trader Simulator Backend Starting...
📊 Access at: http://localhost:5000
```

### 2. Apri il Frontend (Browser)

Nel tuo browser, apri il file:
```
file:///path/to/ear-trader/app/index.html
```

Oppure usa un server locale:
```bash
cd app
python -m http.server 8000
```

Poi apri: http://localhost:8000

---

## 📖 Guida Uso

### Dashboard

**Portfolio**
- Vedi il tuo capitale disponibile ($50,000 iniziali)
- Monitora le posizioni aperte
- Traccia il P/L totale

**Mercato**
- Seleziona asset (BTC, ETH, SOL)
- Vedi prezzo corrente e variazione %

**Indicatori EAR**
- **EPI (Hurst Exponent)**: Misura persistenza del trend
  - H > 0.75: Trend forte
  - H ≈ 0.5: Random walk (no trend)
  - H < 0.5: Mean-reverting

- **ECI (Criticality Index)**: Prossimità a soglia critica
  - ECI > 0.8: Vicino a transizione
  - ECI < 0.5: Stabile

- **ETB (Topology Balance)**: Salute strutturale
  - ETB > 0.6: Struttura sana
  - ETB < 0.4: Degradata

**Raccomandazione**
- L'assistente EAR analizza gli indicatori e suggerisce azione

### Trade

1. Seleziona **Asset** (BTC, ETH, SOL)
2. Scegli **Direzione** (Long/Short)
3. Inserisci **Quantità**
4. Imposta **Stop Loss** e **Take Profit**
5. Leggi l'analisi dell'**EAR Assistant**
6. Clicca **Esegui Trade**

**Nota:** I trade sono simulati. Nessun denaro reale viene usato.

### Analisi

Visualizzazione approfondita degli indicatori EAR:
- Trend EPI negli ultimi 30 giorni
- Breakdown componenti ECI
- Distribuzione topologica (Tree/Lattice/Loop)

### Storia

- Tabella di tutti i trade eseguiti
- Statistiche aggregate:
  - Win Rate
  - Sharpe Ratio
  - Max Drawdown
  - Avg Win/Loss

---

## 🧪 Workflow Consigliato

### Fase 1: Osservazione (Settimana 1-2)
1. Apri l'app ogni giorno
2. Studia gli indicatori EAR per BTC
3. Confronta raccomandazione con movimento effettivo
4. **Non fare trade**, solo osserva

### Fase 2: Paper Trading (Mese 1-3)
1. Inizia a fare trade simulati
2. Segui le raccomandazioni dell'assistente
3. Registra risultati
4. Obiettivo: Sharpe > 1.5

### Fase 3: Affinamento (Mese 4+)
1. Identifica pattern che funzionano
2. Ottimizza sizing e stop loss
3. Sperimenta con entry/exit timing
4. Monitora consistenza

---

## 🔧 Troubleshooting

### "Errore caricamento dati"
**Soluzione:**
- Verifica che il backend Python sia avviato
- Controlla che non ci sia firewall che blocca porta 5000
- Prova a riavviare il backend

### "Cannot connect to server"
**Soluzione:**
- Assicurati che l'URL del backend sia corretto in `app.js`:
  ```javascript
  const API_URL = 'http://localhost:5000/api';
  ```
- Se cambi porta, aggiorna qui

### Dati non aggiornati
**Soluzione:**
- L'app usa CoinGecko API gratuita (rate limit: 50 calls/min)
- Se troppo frequente, usa prezzi cached
- Refresh manuale: ricarica pagina

### Database corrotto
**Soluzione:**
```bash
rm data/trades.db
python main.py  # Ricrea database vuoto
```

---

## 📊 Interpretazione Risultati

### Sharpe Ratio
- < 1.0: Scarso (non meglio di caso)
- 1.0-1.5: Buono
- 1.5-2.0: Ottimo
- > 2.0: Eccellente

### Win Rate
- 50%: Baseline (caso)
- 55-60%: Buono
- > 60%: Ottimo

### Max Drawdown
- < 20%: Conservativo
- 20-30%: Moderato
- > 40%: Aggressivo (attenzione)

---

## ⚠️ Disclaimer

**IMPORTANTE:**
- Questa è un'applicazione di **simulazione**
- Non usa denaro reale
- Non è consulenza finanziaria
- Usala solo per educazione/pratica
- Prima di fare trading reale, consulta professionisti

---

## 🎓 Prossimi Passi

Dopo 3-6 mesi di paper trading con Sharpe > 1.5:

1. **Rivedi risultati** con occhio critico
2. **Identifica edge reale** (non fortuna)
3. **Considera** se procedere con capitale reale (5-10% portfolio)
4. **Continua journaling** anche con soldi veri

---

## 📝 Note Tecniche

### Calcolo Hurst Exponent
Implementato con R/S analysis (rescaled range).
Window: ultimi 100 giorni.

### Calcolo ECI
Combinazione pesata di:
- Volatility compression (40%)
- Correlation instability (30%)
- Momentum divergence (30%)

### Calcolo ETB
Approssimazione da price data:
- Tree: trend consistency
- Lattice: mean reversion
- Loop: autocorrelation

### Data Source
- **Prezzi live**: CoinGecko API v3
- **Storico**: 365 giorni OHLC
- **Frequenza update**: 30 secondi

---

## 🤝 Supporto

Per domande o problemi:
1. Leggi attentamente questa guida
2. Verifica di aver seguito tutti gli step
3. Controlla i log del backend Python

---

## 📜 Licenza

Uso personale ed educativo.  
© 2025 EAR Lab

---

**Buon Paper Trading! 🚀**
