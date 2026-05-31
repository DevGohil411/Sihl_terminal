import pandas as pd
import numpy as np
import json
import os
import sys
import webbrowser

def load_data_and_db():
    excel_path = r"f:\Exit time option\techinal imbalance python\Nifty_15m_Combined (1).xlsx"
    db_path = r"f:\Exit time option\techinal imbalance python\imbalance_database_classic.xlsx"
    
    # 1. Load standardised OHLC data
    from data_loader import load_and_standardize_data
    df = load_and_standardize_data(excel_path)
    df['datetime_str'] = df['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # 2. Load the Imbalance Database
    df_vis = pd.read_excel(db_path, sheet_name='All Imbalances')
    
    # Generate strict Pandas Datetime columns for secure, error-free sorting and filtering
    df_vis['creation_datetime_dt'] = pd.to_datetime(df_vis['creation_datetime'])
    df_vis['mitigation_datetime_dt'] = pd.to_datetime(df_vis['mitigation_datetime'], errors='coerce')
    df_vis['first_touch_datetime_dt'] = pd.to_datetime(df_vis['first_touch_datetime'], errors='coerce')
    
    # Clean NaN and types for presentation
    df_vis['mitigation_datetime'] = df_vis['mitigation_datetime'].fillna('Active')
    df_vis['first_touch_datetime'] = df_vis['first_touch_datetime'].fillna('Never Touched')
    df_vis['creation_index'] = df_vis['creation_index'].astype(int)
    df_vis['mitigation_index'] = pd.to_numeric(df_vis['mitigation_index'], errors='coerce').fillna(len(df)-1).astype(int)
    df_vis['first_touch_index'] = pd.to_numeric(df_vis['first_touch_index'], errors='coerce').fillna(-1).astype(int)
    
    return df, df_vis

def generate_replay_html(df_slice, df_vis_slice, title_text, output_file):
    """
    Generates a 100% self-contained interactive Bar Replay HTML page for Nifty 15m.
    Uses clean placeholder replacement to completely avoid Python f-string escaping issues.
    
    Implements a real-time historical Volume Imbalance Simulator:
    Zones grow, trigger touches, and lock mitigations dynamically as replay steps forward!
    """
    # 1. Convert candle data slice to JSON list
    candles_list = []
    for _, row in df_slice.iterrows():
        candles_list.append({
            'datetime': row['datetime_str'],
            'open': float(row['open']),
            'high': float(row['high']),
            'low': float(row['low']),
            'close': float(row['close'])
        })
    candles_json = json.dumps(candles_list)
    
    # 2. Convert imbalance data slice to JSON list
    vis_list = []
    for _, row in df_vis_slice.iterrows():
        vis_list.append({
            'imbalance_id': str(row['imbalance_id']),
            'imbalance_type': str(row['imbalance_type']),
            'vi_subtype': str(row['vi_subtype']),
            'active_status': bool(row['active_status']),
            'top_price': float(row['top_price']),
            'bottom_price': float(row['bottom_price']),
            'creation_datetime': str(row['creation_datetime']),
            'first_touch_datetime': str(row['first_touch_datetime']),
            'mitigation_datetime': str(row['mitigation_datetime']),
            'first_touch_detected': bool(row['first_touch_detected'])
        })
    vis_json = json.dumps(vis_list)
    
    # Pure HTML/JS Template with standard single braces!
    html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>__TITLE_TEXT__ - Bar Replay Simulator</title>
    <!-- Use local offline Plotly engine for instant, zero-latency rendering -->
    <script src="plotly.min.js"></script>
    <style>
        body {
            background-color: #f8fafc;
            color: #1e293b;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        h2 {
            margin: 0;
            color: #0f172a;
            font-size: 26px;
            font-weight: 700;
        }
        .subtitle {
            color: #64748b;
            font-size: 13px;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
        }
        /* Replay Control Dashboard */
        .control-panel {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 15px 25px;
            width: 95%;
            max-width: 1100px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }
        .control-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
        }
        .btn-group {
            display: flex;
            gap: 8px;
        }
        .control-btn {
            background-color: #f1f5f9;
            color: #0f172a;
            border: 1px solid #cbd5e1;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            user-select: none;
        }
        .control-btn:hover {
            background-color: #e2e8f0;
            transform: translateY(-1px);
        }
        .control-btn:active {
            transform: translateY(0);
        }
        .btn-play {
            background-color: #10b981;
            color: white;
            border-color: #059669;
        }
        .btn-play:hover {
            background-color: #059669;
        }
        .btn-pause {
            background-color: #ef4444;
            color: white;
            border-color: #dc2626;
        }
        .btn-pause:hover {
            background-color: #dc2626;
        }
        /* Slider Styling */
        .slider-container {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-grow: 1;
        }
        .replay-slider {
            width: 100%;
            height: 8px;
            border-radius: 5px;
            background: #cbd5e1;
            outline: none;
            -webkit-appearance: none;
            cursor: pointer;
        }
        .replay-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #00B050;
            cursor: pointer;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
            transition: transform 0.1s;
        }
        .replay-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }
        .status-display {
            font-family: monospace;
            font-size: 14px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 14px;
            border-radius: 6px;
            font-weight: bold;
            color: #334155;
            min-width: 280px;
            text-align: center;
        }
        .speed-panel {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            font-weight: 600;
            color: #475569;
        }
        .speed-slider {
            width: 140px;
            cursor: pointer;
        }
        #chart-container {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px;
            width: 95%;
            max-width: 1100px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            height: 650px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>__TITLE_TEXT__</h2>
        <div class="subtitle">Interactive Real-Time Volume Imbalance Replay Simulator</div>
    </div>
    
    <div class="control-panel">
        <div class="control-row">
            <div class="btn-group">
                <button class="control-btn" onclick="resetReplay()">⏮️ Reset</button>
                <button class="control-btn" onclick="stepBack()">◀️ Step Back</button>
                <button class="control-btn btn-play" id="playBtn" onclick="togglePlay()">▶️ Play</button>
                <button class="control-btn" onclick="stepForward()">▶️ Step Forward</button>
            </div>
            
            <div class="speed-panel">
                <span>Speed:</span>
                <input type="range" id="speedSlider" class="speed-slider" min="500" max="25000" step="250" value="2500" onchange="updateSpeed(this.value)">
                <span id="speedLabel">2.50s / candle</span>
            </div>
            
            <div class="status-display" id="statusBox">
                Initializing...
            </div>
        </div>
        
        <div class="slider-container">
            <span style="font-size:12px; font-weight:bold; color:#64748b;">Start</span>
            <input type="range" id="replaySlider" class="replay-slider" min="0" max="__MAX_INDEX__" value="40" oninput="scrubTo(this.value)">
            <span style="font-size:12px; font-weight:bold; color:#64748b;">End</span>
        </div>
    </div>
    
    <div id="chart-container">
        <div id="plotly-chart" style="width:100%; height:100%;"></div>
    </div>

    <script>
        const allCandles = __CANDLES_JSON__;
        const allImbalances = __VIS_JSON__;
        
        // State variables
        let currentIndex = 40;
        let playInterval = null;
        let playbackDelay = 2500; // 2.5s backtesting speed
        
        // Dynamic Trace Generation Logic for real-time simulation
        function calculateTraces() {
            const visibleSlice = allCandles.slice(0, currentIndex + 1);
            
            // Map datetime string -> index in the currently visible slice
            const dtToIdx = {};
            visibleSlice.forEach((c, idx) => {
                dtToIdx[c.datetime] = idx;
            });
            
            const bullishX = [];
            const bullishY = [];
            const bullishHover = [];
            
            const bearishX = [];
            const bearishY = [];
            const bearishHover = [];
            
            const touchX = [];
            const touchY = [];
            const touchHover = [];
            
            allImbalances.forEach(imb => {
                const cTime = imb.creation_datetime;
                const mTime = imb.mitigation_datetime;
                const ftTime = imb.first_touch_datetime;
                
                // 1. Is this zone created in our current historical timeline?
                if (cTime in dtToIdx) {
                    const startIdx = dtToIdx[cTime];
                    
                    // 2. Grow the zone to the right dynamically until mitigated
                    let endIdx = currentIndex;
                    if (mTime !== 'Active') {
                        if (mTime in dtToIdx) {
                            // Mitigated! Lock the boundary
                            endIdx = dtToIdx[mTime];
                        }
                    }
                    
                    const top = imb.top_price;
                    const bottom = imb.bottom_price;
                    
                    const xCoords = [startIdx, startIdx, endIdx, endIdx, startIdx, null];
                    const yCoords = [bottom, top, top, bottom, bottom, null];
                    
                    const isMitigatedNow = (mTime !== 'Active' && mTime in dtToIdx);
                    const statusStr = isMitigatedNow ? `MITIGATED (Locked)` : 'ACTIVE (Growing)';
                    
                    const hoverInfo = `<b>ID:</b> ${imb.imbalance_id}<br>` +
                                      `<b>Type:</b> ${imb.imbalance_type.toUpperCase()}<br>` +
                                      `<b>Status:</b> ${statusStr}<br>` +
                                      `<b>Range:</b> ${bottom.toFixed(2)} - ${top.toFixed(2)}<br>` +
                                      `<b>Created:</b> ${cTime}<br>` +
                                      `<b>Mitigated:</b> ${mTime}`;
                                      
                    const hoverText = [hoverInfo, hoverInfo, hoverInfo, hoverInfo, hoverInfo, null];
                    
                    if (imb.imbalance_type === 'bullish') {
                        bullishX.push(...xCoords);
                        bullishY.push(...yCoords);
                        bullishHover.push(...hoverText);
                    } else {
                        bearishX.push(...xCoords);
                        bearishY.push(...yCoords);
                        bearishHover.push(...hoverText);
                    }
                    
                    // 3. Trigger Touch Marker live if reached
                    if (imb.first_touch_detected && ftTime !== 'Never Touched' && ftTime in dtToIdx) {
                        const ftIdx = dtToIdx[ftTime];
                        const candle = visibleSlice[ftIdx];
                        const ftPrice = imb.imbalance_type === 'bullish' ? candle.low : candle.high;
                        
                        touchX.push(ftIdx);
                        touchY.push(ftPrice);
                        touchHover.push(`<b>First Touch Event</b><br><b>Zone ID:</b> ${imb.imbalance_id}<br><b>Touch Time:</b> ${ftTime}`);
                    }
                }
            });
            
            // Shaded Bullish Zones Trace (Drawn in background)
            const bullTrace = {
                x: bullishX,
                y: bullishY,
                fill: 'toself',
                fillcolor: 'rgba(76, 175, 80, 0.12)',
                line: { color: 'rgba(76, 175, 80, 0.50)', width: 1.2 },
                hoveron: 'fills',
                hovertext: bullishHover,
                hoverinfo: 'text',
                name: 'Bullish Zones',
                type: 'scatter',
                mode: 'lines'
            };
            
            // Shaded Bearish Zones Trace (Drawn in background)
            const bearTrace = {
                x: bearishX,
                y: bearishY,
                fill: 'toself',
                fillcolor: 'rgba(244, 67, 54, 0.12)',
                line: { color: 'rgba(244, 67, 54, 0.50)', width: 1.2 },
                hoveron: 'fills',
                hovertext: bearishHover,
                hoverinfo: 'text',
                name: 'Bearish Zones',
                type: 'scatter',
                mode: 'lines'
            };
            
            // Touch Markers Trace
            const touchTrace = {
                x: touchX,
                y: touchY,
                mode: 'markers',
                marker: { symbol: 'triangle-up', size: 11, color: '#FF6F00', line: { color: '#E65100', width: 1.5 } },
                hovertext: touchHover,
                hoverinfo: 'text',
                name: 'First Touch Events',
                type: 'scatter'
            };
            
            // Core 15m Candlestick Trace (Drawn LAST to sit on top of everything)
            const candleTrace = {
                x: visibleSlice.map((_, i) => i),
                open: visibleSlice.map(c => c.open),
                high: visibleSlice.map(c => c.high),
                low: visibleSlice.map(c => c.low),
                close: visibleSlice.map(c => c.close),
                type: 'candlestick',
                name: 'Nifty Spot',
                increasing: { line: { color: '#00B050' }, fillcolor: '#00B050' },
                decreasing: { line: { color: '#FF3A3A' }, fillcolor: '#FF3A3A' },
                line: { width: 1.8 },
                id: 'spot-candles'
            };
            
            return [bullTrace, bearTrace, touchTrace, candleTrace];
        }
        
        function initChart() {
            const traces = calculateTraces();
            const visibleSlice = allCandles.slice(0, currentIndex + 1);
            
            // Ticks spacing
            const tickIndices = [];
            const tickLabels = [];
            const step = Math.max(1, Math.floor(visibleSlice.length / 8));
            for (let i = 0; i < visibleSlice.length; i += step) {
                tickIndices.push(i);
                const dt = visibleSlice[i].datetime;
                const mo = dt.substring(5, 7);
                const dy = dt.substring(8, 10);
                const hr = dt.substring(11, 16);
                tickLabels.push(`${dy}-${mo} ${hr}`);
            }
            
            const layout = {
                template: 'plotly_white',
                paper_bgcolor: '#FFFFFF',
                plot_bgcolor: '#FFFFFF',
                xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: Array.from(Array(allCandles.length).keys()),
                    tickmode: 'array',
                    tickvals: tickIndices,
                    ticktext: tickLabels,
                    title: {
                        text: 'Continuous Trading Sessions (All overnight, weekend, and raw gaps dynamically hidden)',
                        font: { color: '#1E293B', size: 13 }
                    },
                    gridcolor: '#F1F5F9',
                    linecolor: '#CBD5E1',
                    tickfont: { color: '#475569' },
                    rangeslider: { visible: false }
                },
                yaxis: {
                    title: {
                        text: 'Nifty Spot Price',
                        font: { color: '#1E293B', size: 13 }
                    },
                    gridcolor: '#F1F5F9',
                    linecolor: '#CBD5E1',
                    tickfont: { color: '#475569' },
                    fixedrange: false
                },
                margin: { t: 40, b: 60, l: 60, r: 40 },
                uirevision: 'true',
                hovermode: 'closest'
            };
            
            Plotly.newPlot('plotly-chart', traces, layout, { responsive: true, displayModeBar: true });
            updateStatus();
        }
        
        // High-performance live update loop
        function updateChartData() {
            const traces = calculateTraces();
            const visibleSlice = allCandles.slice(0, currentIndex + 1);
            
            const tickIndices = [];
            const tickLabels = [];
            const step = Math.max(1, Math.floor(visibleSlice.length / 8));
            for (let i = 0; i < visibleSlice.length; i += step) {
                tickIndices.push(i);
                const dt = visibleSlice[i].datetime;
                const mo = dt.substring(5, 7);
                const dy = dt.substring(8, 10);
                const hr = dt.substring(11, 16);
                tickLabels.push(`${dy}-${mo} ${hr}`);
            }
            
            // Full trace swap for dynamic box growth
            Plotly.react('plotly-chart', traces, {
                template: 'plotly_white',
                paper_bgcolor: '#FFFFFF',
                plot_bgcolor: '#FFFFFF',
                xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: Array.from(Array(allCandles.length).keys()),
                    tickmode: 'array',
                    tickvals: tickIndices,
                    ticktext: tickLabels,
                    title: {
                        text: 'Continuous Trading Sessions (All overnight, weekend, and raw gaps dynamically hidden)',
                        font: { color: '#1E293B', size: 13 }
                    },
                    gridcolor: '#F1F5F9',
                    linecolor: '#CBD5E1',
                    tickfont: { color: '#475569' },
                    rangeslider: { visible: false }
                },
                yaxis: {
                    title: {
                        text: 'Nifty Spot Price',
                        font: { color: '#1E293B', size: 13 }
                    },
                    gridcolor: '#F1F5F9',
                    linecolor: '#CBD5E1',
                    tickfont: { color: '#475569' },
                    fixedrange: false
                },
                margin: { t: 40, b: 60, l: 60, r: 40 },
                uirevision: 'true',
                hovermode: 'closest'
            });
            
            document.getElementById('replaySlider').value = currentIndex;
            updateStatus();
        }
        
        function updateStatus() {
            const currentCandle = allCandles[currentIndex];
            const box = document.getElementById('statusBox');
            box.innerHTML = `📅 ${currentCandle.datetime.substring(0, 10)} | ⏰ ${currentCandle.datetime.substring(11)} | #${currentIndex + 1} of ${allCandles.length}`;
        }
        
        function stepForward() {
            if (currentIndex < allCandles.length - 1) {
                currentIndex++;
                updateChartData();
            } else {
                pauseReplay();
            }
        }
        
        // Step back in history with instant trace deletion
        function stepBack() {
            if (currentIndex > 0) {
                currentIndex--;
                updateChartData();
            }
        }
        
        function resetReplay() {
            pauseReplay();
            currentIndex = 0;
            updateChartData();
        }
        
        function scrubTo(val) {
            currentIndex = parseInt(val);
            updateChartData();
        }
        
        function togglePlay() {
            const playBtn = document.getElementById('playBtn');
            if (playInterval) {
                pauseReplay();
            } else {
                playBtn.innerText = "⏸️ Pause";
                playBtn.className = "control-btn btn-pause";
                playInterval = setInterval(stepForward, playbackDelay);
            }
        }
        
        function pauseReplay() {
            const playBtn = document.getElementById('playBtn');
            if (playInterval) {
                clearInterval(playInterval);
                playInterval = null;
            }
            playBtn.innerText = "▶️ Play";
            playBtn.className = "control-btn btn-play";
        }
        
        function updateSpeed(val) {
            playbackDelay = parseInt(val);
            document.getElementById('speedLabel').innerText = `${(playbackDelay / 1000).toFixed(2)}s / candle`;
            
            if (playInterval) {
                clearInterval(playInterval);
                playInterval = setInterval(stepForward, playbackDelay);
            }
        }
        
        window.onload = initChart;
    </script>
</body>
</html>
"""
    
    # Render with elegant and safe Python replacement
    html_content = html_template.replace("__TITLE_TEXT__", title_text)\
                                .replace("__MAX_INDEX__", str(len(df_slice) - 1))\
                                .replace("__CANDLES_JSON__", candles_json)\
                                .replace("__VIS_JSON__", vis_json)
                                
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

def generate_all_monthly_charts(df, df_vis):
    """
    Groups data by Year-Month and auto-generates 50 focused Bar Replay HTML files,
    then creates a stunning light-themed master dashboard navigation index.
    """
    output_dir = r"f:\Exit time option\techinal imbalance python\monthly_charts"
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Write the offline Plotly engine to the folder once (shared by all 50 files)
    plotly_js_path = os.path.join(output_dir, "plotly.min.js")
    if not os.path.exists(plotly_js_path):
        print("Writing offline shared graphics engine (plotly.min.js)...")
        import plotly.offline as offline
        with open(plotly_js_path, 'w', encoding='utf-8') as f:
            f.write(offline.get_plotlyjs())
            
    print("\n" + "="*50)
    print("      GENERATING MONTHLY BAR REPLAY LIBRARY       ")
    print("="*50)
    
    df['year_month'] = df['datetime'].dt.strftime('%Y-%m')
    unique_months = sorted(df['year_month'].unique())
    
    print(f"Detected {len(unique_months)} unique months in historical data.")
    print("Processing batch exports silently (please wait)...")
    
    monthly_files = []
    
    for i, ym in enumerate(unique_months, 1):
        df_slice = df[df['year_month'] == ym].copy()
        if df_slice.empty:
            continue
            
        start_time = df_slice['datetime'].min()
        end_time = df_slice['datetime'].max()
        
        # KEY SIMULATION RULE: Load imbalance events created during this specific month
        df_vis_slice = df_vis[
            (df_vis['creation_datetime_dt'] >= start_time) &
            (df_vis['creation_datetime_dt'] <= end_time)
        ].copy()
        
        filename = f"Nifty_Imbalance_Chart_{ym.replace('-', '_')}.html"
        full_path = os.path.join(output_dir, filename)
        
        # Generate the premium Bar Replay Simulator HTML
        generate_replay_html(df_slice, df_vis_slice, f"Nifty 15m - Focused Replay for {ym}", full_path)
        monthly_files.append((ym, filename))
        
        print(f"[{i}/{len(unique_months)}] Generated Replay Simulator: {filename} ({len(df_slice)} candles, {len(df_vis_slice)} simulated zones)")
        
    # Generate Stunning Light Mode Master Index Page
    index_path = os.path.join(output_dir, "monthly_charts_index.html")
    
    # Organize monthly files by Year
    years_dict = {}
    for ym, fname in monthly_files:
        yr, mn = ym.split('-')
        month_names = {
            '01': 'January', '02': 'February', '03': 'March', '04': 'April',
            '05': 'May', '06': 'June', '07': 'July', '08': 'August',
            '09': 'September', '10': 'October', '11': 'November', '12': 'December'
        }
        m_name = month_names.get(mn, mn)
        if yr not in years_dict:
            years_dict[yr] = []
        years_dict[yr].append((m_name, fname))
        
    # Build HTML Index Content
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Nifty Imbalance Monthly Replay Library</title>
    <style>
        body {
            background-color: #f8fafc;
            color: #1e293b;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        h1 {
            color: #0f172a;
            font-size: 32px;
            margin-bottom: 5px;
            text-align: center;
            font-weight: 700;
        }
        .subtitle {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 40px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }
        .container {
            width: 100%;
            max-width: 1100px;
        }
        .year-section {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        .year-title {
            color: #0f172a;
            font-size: 22px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 15px;
        }
        .month-btn {
            background-color: #f1f5f9;
            color: #334155;
            text-decoration: none;
            padding: 12px;
            text-align: center;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
        }
        .month-btn:hover {
            background-color: #00B050;
            color: #ffffff;
            border-color: #00B050;
            box-shadow: 0 4px 12px rgba(0, 176, 80, 0.25);
            transform: translateY(-2px);
        }
        footer {
            margin-top: 50px;
            color: #64748b;
            font-size: 12px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <h1>NIFTY SPOT MONTHLY BAR REPLAY LIBRARY</h1>
    <div class="subtitle">Chronological Month-on-Month Gap-Free Replay Mode (2022-2026)</div>
    
    <div class="container">
"""
    
    for yr in sorted(years_dict.keys()):
        html_content += f"""        <div class="year-section">
            <div class="year-title">{yr}</div>
            <div class="grid">
"""
        for m_name, fname in years_dict[yr]:
            html_content += f'                <a class="month-btn" href="{fname}" target="_blank">{m_name}</a>\n'
            
        html_content += """            </div>
        </div>
"""
        
    html_content += """    </div>
    <footer>Engine generated by Antigravity Quantitative Research Team &bull; May 2026</footer>
</body>
</html>
"""
    
    with open(index_path, 'w') as f:
        f.write(html_content)
        
    print(f"\n[SUCCESS] Master Bar Replay Library generated successfully!")
    print(f"Index File: {index_path}")
    webbrowser.open('file://' + os.path.realpath(index_path))
    print("[OK] Opened master monthly visual library in your browser!")

def main():
    try:
        df, df_vis = load_data_and_db()
    except Exception as e:
        print(f"[ERROR] Could not load databases: {e}")
        print("Please run f:\\Exit time option\\techinal imbalance python\\imbalance_detector.py first to generate the database.")
        sys.exit(1)
        
    print("Directing directly to Monthly Bar Replay generation...")
    generate_all_monthly_charts(df, df_vis)

if __name__ == "__main__":
    main()