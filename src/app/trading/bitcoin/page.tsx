
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BitcoinTradingPage() {
  const router = useRouter();

  const bitcoinHtml = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Connect Bitcoin Trader — Improved</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg1:#05101b; --bg2:#071826;
      --card: rgba(255,255,255,0.03);
      --accent:#f7931a;
      --good:#16a34a; --bad:#ef4444;
    }
    *{box-sizing:border-box;font-family:Inter,system-ui,Segoe UI,Roboto,Arial}
    html,body{height:100%;margin:0;background:
      radial-gradient(900px 420px at 8% 8%, rgba(247,147,26,0.05), transparent 6%),
      linear-gradient(180deg,var(--bg1),var(--bg2));
      color:#e6eef8; overflow-x: hidden;}
    .wrap{max-width:1100px;margin:28px auto;padding:18px;}
    header{display:flex;align-items:center;gap:14px;justify-content:space-between}
    .logo{width:62px;height:62px;border-radius:14px;background:linear-gradient(180deg,#ffd89b,#f7931a);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 40px rgba(247,147,26,0.12)}
    .title{font-size:20px;margin:0; font-family: Montserrat, sans-serif; font-weight: 800; text-transform: uppercase; font-style: italic;}
    .subtitle{font-size:12px;color:rgba(230,238,248,0.75)}
    .grid{display:grid;grid-template-columns:1fr 360px;gap:18px;margin-top:18px}
    .card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));padding:14px;border-radius:12px;box-shadow:0 6px 30px rgba(2,6,23,0.5);border:1px solid rgba(255,255,255,0.03)}
    .chart-area{height:420px;padding:8px;border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,0.01),transparent)}
    .price-row{display:flex;align-items:center;justify-content:space-between;padding:8px 6px}
    .price{font-weight:800;font-size:22px}
    .small{font-size:12px;color:rgba(230,238,248,0.75)}
    .trade-panel{display:flex;flex-direction:column;gap:10px}
    .balance{display:flex;gap:10px;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px}
    .input,select{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);background:#0a0a0a;color:inherit}
    .btn{padding:10px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:800; text-transform: uppercase;}
    .btn-buy{background:linear-gradient(90deg,#10b981,#06b6d4);color:#03221f}
    .btn-sell{background:linear-gradient(90deg,#ef4444,#f97316);color:white}
    .btn:disabled{opacity: 0.5; cursor: not-allowed;}
    .center{display:flex;justify-content:center;align-items:center}
    .orders{max-height:200px;overflow:auto;margin-top:6px}
    table{width:100%;border-collapse:collapse;color:inherit}
    th,td{padding:8px;text-align:left;border-bottom:1px dashed rgba(255,255,255,0.03);font-size:13px}
    .result-banner{padding:10px;border-radius:8px;text-align:center;font-weight:700}
    .hidden{display:none}
    footer{margin-top:12px;color:rgba(230,238,248,0.55);font-size:13px;text-align:center}
    @media(max-width:980px){.grid{grid-template-columns:1fr}.chart-area{height:300px}}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div style="display:flex;align-items:center;gap:14px">
        <div class="logo" aria-hidden>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#fff" opacity="0.06"/><path d="M13.5 7.5c.45-1.82-2.03-2.24-2.86-2.32L10 5l-.35 1.4-1.56.12L7.7 5l-1.1 3.9 1.28.09-.02.07c-.72.05-1.7.26-1.84 1.4-.15 1.3.9 1.66 1.8 1.92L9 13.9l-.36 1.46L9.6 15l.59.04c.43 0 2.24-.03 2.62-1.28.47-1.54-.27-2.03-.96-2.42.69-.15 1.58-.5 1.78-1.86z" fill="#f7931a"/></svg>
        </div>
        <div>
          <h1 class="title">Bitcoin 💲 Trader — CP</h1>
          <div class="subtitle">Slower chart + friendlier win odds (demo only)</div>
        </div>
      </div>
      <div id="userTag" class="small"></div>
    </header>

    <div class="grid">
      <div class="card">
        <div class="price-row">
          <div>
            <div class="price" id="priceDisplay">--</div>
            <div class="small">Simulated BTC/USDT • <span id="timeDisplay">--</span></div>
          </div>
          <div style="text-align:right">
            <div id="outcomeInfo" class="small">Choose Buy or Sell to play</div>
            <div class="small">Payout on win: <strong id="payoutPct">1.9x</strong></div>
          </div>
        </div>

        <div class="chart-area card">
          <canvas id="chartCanvas" style="width:100%;height:100%"></canvas>
        </div>

        <div style="display:flex;gap:10px;margin-top:10px">
          <div style="flex:1" class="card small">
            <div style="font-weight:700;margin-bottom:6px">Recent Results</div>
            <div class="orders" id="historyBox">
              <table><thead><tr><th>Time</th><th>Side</th><th>Bet</th><th>Result</th></tr></thead><tbody id="historyTbody"></tbody></table>
            </div>
          </div>

          <div style="width:220px" class="card small center">
            <div>
              <div style="font-weight:700;margin-bottom:6px">Notes</div>
              <div class="small">This Bitcoin Value Increase Or Decrease Based On VLC.Tec.</div>
            </div>
          </div>
        </div>
      </div>

      <aside class="card">
        <div class="trade-panel">
          <div class="balance">
            <div>
              <div class="small">USD Balance</div>
              <div id="usdBalance">$1000.00</div>
            </div>
            <div>
              <div class="small">Game Token (BTC)</div>
              <div id="btcBalance">0.00000000</div>
            </div>
          </div>

          <div>
            <label class="small">Bet Amount (USD)</label>
            <input id="betInput" class="input" placeholder="Enter USD to bet" type="number" step="0.01" min="0.01" value="10"/>
          </div>

          <div>
            <label class="small">Mode</label>
            <select id="modeSelect" class="input">
              <option value="chart">Chart-based</option>
              <option value="coin">Coin flip</option>
            </select>
          </div>

          <div style="display:flex;gap:8px">
            <button id="buyBtn" class="btn btn-buy" style="flex:1">BUY</button>
            <button id="sellBtn" class="btn btn-sell" style="flex:1">SELL</button>
          </div>

          <div id="countdown" class="small" style="margin-top:8px">Round: idle</div>
          <div id="resultBanner" class="result-banner hidden"></div>
          <div style="margin-top:8px" class="small opacity-50">Note: Use for exchange of redeem codes.</div>
        </div>
      </aside>
    </div>

    <footer>Made By ♥ CP — SV-12 Pro Active &bull; VLF-TEC</footer>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>

  <script>
    const START_USD = 1000.00;
    const PAYOUT_MULTIPLIER = 1.9;
    const ROUND_SECONDS = 5;
    const TICKS_PER_SECOND = 2;
    const MAX_POINTS = 180;
    const COIN_WIN_CHANCE = 0.58;
    const CHART_RESURRECT_CHANCE = 0.15;

    const firebaseConfig = {
      apiKey: "AIzaSyBpvng4Am-rhTPwSvWKxAGN2WCqBwsoAaM",
      authDomain: "bitcoin-fa4b2.firebaseapp.com",
      databaseURL: "https://bitcoin-fa4b2-default-rtdb.firebaseio.com",
      projectId: "bitcoin-fa4b2",
      storageBucket: "bitcoin-fa4b2.firebasestorage.app",
      messagingSenderId: "311271969444",
      appId: "1:311271969444:web:7fb50ae0439b9bde600c31"
    };

    let usdBalance = START_USD;
    let btcBalance = 0.0;
    let roundActive = false;

    const usdEl = document.getElementById('usdBalance');
    const btcEl = document.getElementById('btcBalance');
    const priceDisplay = document.getElementById('priceDisplay');
    const timeDisplay = document.getElementById('timeDisplay');
    const outcomeInfo = document.getElementById('outcomeInfo');
    const payoutPct = document.getElementById('payoutPct');
    const betInput = document.getElementById('betInput');
    const buyBtn = document.getElementById('buyBtn');
    const sellBtn = document.getElementById('sellBtn');
    const modeSelect = document.getElementById('modeSelect');
    const countdownEl = document.getElementById('countdown');
    const resultBanner = document.getElementById('resultBanner');
    const historyTbody = document.getElementById('historyTbody');
    const userTagEl = document.getElementById("userTag");

    const ctx = document.getElementById('chartCanvas').getContext('2d');
    Chart.defaults.animation = false;
    const chartData = { labels: [], datasets: [{ label:'BTC', data: [], fill: true, tension: 0.22, pointRadius: 0, borderColor: '#f7931a', backgroundColor: 'rgba(247,147,26,0.1)' }] };
    const chart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)', callback: (v) => '$' + Number(v).toLocaleString() } }
        }
      }
    });

    function formatUSD(n) { return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 }); }
    function addHistory(side, bet, resultText) {
      const tr = document.createElement('tr');
      tr.innerHTML = \`<td>\${new Date().toLocaleTimeString()}</td><td>\${side}</td><td>\${formatUSD(bet)}</td><td>\${resultText}</td>\`;
      historyTbody.prepend(tr);
    }
    function updateBalances() {
      usdEl.textContent = formatUSD(usdBalance);
      btcEl.textContent = btcBalance.toFixed(8);
    }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function setButtonsEnabled(enabled) { buyBtn.disabled = !enabled; sellBtn.disabled = !enabled; }

    let basePrice = 60000 + (Math.random() - 0.5) * 2000;
    let timeIndex = 0;
    function simulateNextPrice() {
      basePrice += (Math.random() - 0.5) * 5;
      const p = Math.max(50, basePrice + Math.sin(timeIndex * 0.1) * 20);
      timeIndex++;
      return Number(p.toFixed(2));
    }

    async function startRound(side) {
      if (roundActive) return;
      const bet = Number(betInput.value);
      if (isNaN(bet) || bet <= 0 || bet > usdBalance) return;
      
      setButtonsEnabled(false);
      roundActive = true;
      resultBanner.classList.add('hidden');
      usdBalance = Number((usdBalance - bet).toFixed(2));
      updateBalances();
      updateFirebaseBalance();

      if (modeSelect.value === 'coin') {
        await handleCoinFlip(side, bet);
      } else {
        await handleChartTrade(side, bet);
      }
      setButtonsEnabled(true);
      roundActive = false;
    }

    async function handleCoinFlip(side, bet) {
      countdownEl.textContent = 'Processing...';
      await sleep(1000);
      const win = Math.random() < COIN_WIN_CHANCE;
      if (win) {
        const payout = Number((bet * PAYOUT_MULTIPLIER).toFixed(2));
        usdBalance = Number((usdBalance + payout).toFixed(2));
        showResult(true, bet, payout, 'Coin Win');
        addHistory(side, bet, 'WIN');
      } else {
        showResult(false, bet, null, 'Coin Loss');
        addHistory(side, bet, 'LOSE');
      }
      updateBalances();
      updateFirebaseBalance();
    }

    async function handleChartTrade(side, bet) {
      const entryPrice = chartData.datasets[0].data.slice(-1)[0];
      for(let i = ROUND_SECONDS; i > 0; i--) {
        countdownEl.textContent = \`Round: \${i}s\`;
        await sleep(1000);
      }
      const finalPrice = chartData.datasets[0].data.slice(-1)[0];
      let win = (side === 'BUY' && finalPrice > entryPrice) || (side === 'SELL' && finalPrice < entryPrice);
      if (win) {
        const payout = Number((bet * PAYOUT_MULTIPLIER).toFixed(2));
        usdBalance = Number((usdBalance + payout).toFixed(2));
        showResult(true, bet, payout, 'Trade Win');
        addHistory(side, bet, 'WIN');
      } else {
        showResult(false, bet, null, 'Trade Loss');
        addHistory(side, bet, 'LOSE');
      }
      updateBalances();
      updateFirebaseBalance();
    }

    function showResult(win, bet, payout, subtitle) {
      resultBanner.textContent = win ? \`WIN + \${formatUSD(payout - bet)}\` : \`LOSE - \${formatUSD(bet)}\`;
      resultBanner.style.color = win ? 'var(--good)' : 'var(--bad)';
      resultBanner.classList.remove('hidden');
    }

    let db, userRef;
    let username = localStorage.getItem("splash_last_username") || "guest";

    async function initFirebase() {
      try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        userTagEl.textContent = "@" + username;
        userRef = db.ref("trading_balances/" + username.replace(/[^a-zA-Z0-9]/g, '_'));
        const snap = await userRef.once("value");
        if (snap.exists()) usdBalance = Number(snap.val().balance);
        updateBalances();
      } catch (err) { console.error(err); }
    }

    function updateFirebaseBalance() {
      if (userRef) userRef.update({ balance: Number(usdBalance.toFixed(2)), lastUpdate: Date.now() });
    }

    setInterval(() => {
      const p = simulateNextPrice();
      chartData.labels.push(new Date().toLocaleTimeString());
      chartData.datasets[0].data.push(p);
      if (chartData.labels.length > MAX_POINTS) { chartData.labels.shift(); chartData.datasets[0].data.shift(); }
      chart.update('none');
      priceDisplay.textContent = '$' + Number(p).toLocaleString();
      timeDisplay.textContent = new Date().toLocaleTimeString();
    }, 1000 / TICKS_PER_SECOND);

    buyBtn.addEventListener('click', () => startRound('BUY'));
    sellBtn.addEventListener('click', () => startRound('SELL'));
    initFirebase();
  </script>
</body>
</html>
  `;

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden">
      <header className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-amber-400" />
          <h1 className="font-headline font-bold text-sm tracking-tight text-white uppercase italic">Bitcoin Trader</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full bg-[#121212] relative">
        <iframe 
          srcDoc={bitcoinHtml}
          className="absolute inset-0 w-full h-full border-none"
          title="Bitcoin Trader"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </main>
    </div>
  );
}
