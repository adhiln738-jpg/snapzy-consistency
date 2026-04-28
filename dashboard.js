window.COS = window.COS || {};

COS.Dashboard = (function () {
  const D = COS.Data;
  const CIRC = 2 * Math.PI * 40; // r=40 → 251.33

  function getWeekColors() {
    const s = D.loadSettings();
    return s.weekColors || ['#7EB8F7','#F9A8D4','#6EE7B7','#FDE68A','#C4B5FD'];
  }

  /* ─── Animated number counter ─── */
  function animateNumber(el, target, suffix, duration) {
    if (!el) return;
    const dur = duration || 1000;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      el.textContent = Math.round(ease * target) + (suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ─── SVG Donut ─── */
  function donutSVG(pct, color, size, id) {
    const sz = size || 90;
    return `<svg class="donut-svg" width="${sz}" height="${sz}" viewBox="0 0 100 100" style="transform:rotate(-90deg)">
      <circle class="donut-track" cx="50" cy="50" r="40"/>
      <circle class="donut-progress" id="${id||''}" cx="50" cy="50" r="40"
        stroke="${color}"
        stroke-dasharray="${CIRC.toFixed(2)}"
        stroke-dashoffset="${CIRC.toFixed(2)}"
        data-target="${(CIRC - (pct/100)*CIRC).toFixed(2)}"
        stroke-linecap="round"
        style="transition:stroke-dashoffset 1.2s cubic-bezier(0.34,1.1,0.64,1);"/>
    </svg>`;
  }

  /* ─── Animate all rings after render ─── */
  function animateRings() {
    document.querySelectorAll('.donut-progress[data-target]').forEach((el, i) => {
      const target = parseFloat(el.dataset.target);
      setTimeout(() => { el.style.strokeDashoffset = target; }, i * 120);
    });
  }

  /* ─── Quote Card ─── */
  function renderQuoteCard() {
    const s = D.loadSettings();
    const el = document.getElementById('quoteCard');
    if (!el) return;
    el.innerHTML = `
      <p class="card-title">✨ Daily Inspiration</p>
      <div class="quote-text" id="quoteText" contenteditable="true" spellcheck="false">${s.quote}</div>
      <p class="quote-edit-hint">✏️ Click to edit</p>`;
    document.getElementById('quoteText').addEventListener('blur', function() {
      const settings = D.loadSettings();
      settings.quote = this.innerText.trim();
      D.saveSettings(settings);
    });
  }

  /* ─── Affirmation Card ─── */
  function renderAffirmationCard() {
    const s = D.loadSettings();
    const el = document.getElementById('affirmationCard');
    if (!el) return;
    el.innerHTML = `
      <p class="affirmation-label">💫 My Affirmation</p>
      <div class="affirmation-text" id="affText" contenteditable="true" spellcheck="false">I am ${s.affirmation}</div>`;
    document.getElementById('affText').addEventListener('blur', function() {
      const settings = D.loadSettings();
      let val = this.innerText.trim();
      if (val.startsWith('I am ')) val = val.slice(5);
      settings.affirmation = val;
      D.saveSettings(settings);
    });
  }

  /* ─── Role Selector ─── */
  function renderRoleSelector() {
    const s = D.loadSettings();
    const el = document.getElementById('roleSelectorCard');
    if (!el) return;
    const roles = ['Student','Founder','Freelancer','Worker','Creator'];
    el.innerHTML = `
      <p class="card-title">🎯 I Am A</p>
      <div class="role-pills">
        ${roles.map(r => `<button class="role-pill${s.role===r?' active':''}" data-role="${r}">${r}</button>`).join('')}
      </div>`;
    el.querySelectorAll('.role-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.role;
        const habits = D.loadHabits();
        if (habits.length && !confirm(`Switch to ${role} and load default habits? Current habits will be replaced.`)) return;
        const settings = D.loadSettings();
        settings.role = role;
        D.saveSettings(settings);
        COS.RolePresets.applyPreset(role);
        COS.App.refresh();
        COS.App.toast(`🎯 Loaded ${role} habit pack!`, 'info');
      });
    });
  }

  /* ─── Area / Wave Chart (animated path draw) ─── */
  function renderAreaChart() {
    const el = document.getElementById('areaChartWrap');
    if (!el) return;
    const days = D.getDaysInMonth(D.currentYear, D.currentMonth);
    const today = new Date();
    const isCurrent = today.getFullYear()===D.currentYear && today.getMonth()===D.currentMonth;
    const maxDay = isCurrent ? today.getDate() : days;
    const pts = [];
    for (let d = 1; d <= maxDay; d++) pts.push(D.getDailyCompletion(d));
    const monthly = D.getMonthlyCompletion();
    const wColors = getWeekColors();
    const W=500, H=80, pad=24;

    const xs = pts.map((_,i) => pad + (i / Math.max(pts.length-1,1)) * (W-pad*2));
    const ys = pts.map(p => H - 8 - (p/100)*(H-20));

    let polyline='', area='', totalLen=0;
    if (pts.length > 1) {
      polyline = xs.map((x,i) => `${x},${ys[i]}`).join(' ');
      area = `${xs[0]},${H} ` + xs.map((x,i)=>`${x},${ys[i]}`).join(' ') + ` ${xs[xs.length-1]},${H}`;
      // Compute approximate path length for draw animation
      for (let i=1; i<xs.length; i++) {
        const dx=xs[i]-xs[i-1], dy=ys[i]-ys[i-1];
        totalLen += Math.sqrt(dx*dx+dy*dy);
      }
    }

    el.innerHTML = `
      <div class="area-chart-header">
        <span class="area-chart-title">📈 Monthly Trend</span>
        <span class="area-chart-val"><span id="areaChartPct">0</span>% overall</span>
      </div>
      <svg class="area-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${wColors[0]}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${wColors[0]}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${area ? `<polygon points="${area}" fill="url(#areaGrad)"/>` : ''}
        ${polyline ? `<polyline id="areaLine" points="${polyline}" fill="none" stroke="${wColors[0]}"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="${totalLen.toFixed(0)}" stroke-dashoffset="${totalLen.toFixed(0)}"
          style="transition:stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1);"/>` : ''}
        ${pts.map((p,i)=>`<circle cx="${xs[i]}" cy="${ys[i]}" r="3.5" fill="${wColors[D.getWeekIndex(i+1)]}"
          opacity="0" style="transition:opacity .3s ${(i*30)+800}ms;">
        </circle>`).join('')}
      </svg>`;

    // Animate after render
    animateNumber(document.getElementById('areaChartPct'), monthly.pct, '', 900);
    setTimeout(() => {
      const line = document.getElementById('areaLine');
      if (line) line.style.strokeDashoffset = '0';
      el.querySelectorAll('circle').forEach(c => c.setAttribute('opacity','0.9'));
    }, 80);
  }

  /* ─── Weekly Bar Chart (staggered spring animation) ─── */
  function renderWeeklyBars() {
    const el = document.getElementById('weeklyBarsWrap');
    if (!el) return;
    const wColors = getWeekColors();
    const days = D.getDaysInMonth(D.currentYear, D.currentMonth);
    const numWeeks = Math.ceil(days/7);
    const bars = Array.from({length:numWeeks},(_,w) => ({
      label:`W${w+1}`, pct: D.getWeeklyCompletion(w), color: wColors[w]
    }));

    el.innerHTML = `
      <p class="card-title">📊 Weekly Breakdown</p>
      <div class="bar-chart" id="barChartInner">
        ${bars.map((b,i) => `
          <div class="bar-col">
            <span class="bar-pct" id="barpct${i}">0%</span>
            <div class="bar-wrap">
              <div class="bar" id="bar${i}" style="background:${b.color};height:4px;border-radius:6px 6px 0 0;
                transition:height 0.8s cubic-bezier(0.34,1.4,0.64,1) ${i*110}ms;" data-pct="${b.pct}"></div>
            </div>
            <span class="bar-label">${b.label}</span>
          </div>`).join('')}
      </div>`;

    // Staggered animate
    bars.forEach((b, i) => {
      setTimeout(() => {
        const barEl = document.getElementById(`bar${i}`);
        const pctEl = document.getElementById(`barpct${i}`);
        if (barEl) barEl.style.height = Math.max(b.pct, 2) + '%';
        animateNumber(pctEl, b.pct, '%', 700);
      }, i * 80);
    });
  }

  /* ─── Weekly Rings (cascade animate) ─── */
  function renderWeeklyRings() {
    const el = document.getElementById('weeklyRingsWrap');
    if (!el) return;
    const wColors = getWeekColors();
    const days = D.getDaysInMonth(D.currentYear, D.currentMonth);
    const numWeeks = Math.ceil(days/7);
    const weekNames = ['Week 1','Week 2','Week 3','Week 4','Week 5'];

    let html = `<p class="card-title">🔄 Weekly Completion Rings</p><div class="weekly-rings-row">`;
    for (let w=0; w<numWeeks; w++) {
      const pct = D.getWeeklyCompletion(w);
      html += `
        <div class="week-ring-item">
          <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
            ${donutSVG(pct, wColors[w], 84, `wring${w}`)}
            <div style="position:absolute;text-align:center;">
              <span id="wringpct${w}" style="font-family:var(--font-heading);font-size:1rem;font-weight:700;color:var(--text-primary)">0%</span>
            </div>
          </div>
          <span class="week-ring-label" style="color:${wColors[w]}">${weekNames[w]}</span>
        </div>`;
    }
    html += `</div>`;
    el.innerHTML = html;

    // Animate rings and counters with cascade delay
    for (let w=0; w<numWeeks; w++) {
      const pct = D.getWeeklyCompletion(w);
      setTimeout(() => {
        const ring = document.getElementById(`wring${w}`);
        if (ring) ring.style.strokeDashoffset = (CIRC - (pct/100)*CIRC).toFixed(2);
        animateNumber(document.getElementById(`wringpct${w}`), pct, '%', 800);
      }, w * 140 + 100);
    }
  }

  /* ─── Overall Progress Ring ─── */
  function renderOverallRing() {
    const el = document.getElementById('overallRingCard');
    if (!el) return;
    const wColors = getWeekColors();
    const habits = D.loadHabits();
    const { done, total } = D.getMonthlyCompletion();
    const today = new Date();
    const isCurrent = today.getFullYear()===D.currentYear && today.getMonth()===D.currentMonth;
    const todayPct = isCurrent ? D.getDailyCompletion(today.getDate()) : 0;
    const CIRC_BIG = 2 * Math.PI * 52; // r=52

    el.innerHTML = `
      <p class="card-title">🎯 Today's Progress</p>
      <div style="display:flex;flex-direction:column;align-items:center;padding:10px 0 4px;">
        <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
          <svg width="150" height="150" viewBox="0 0 120 120" style="transform:rotate(-90deg);overflow:visible;">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="10"/>
            <circle id="overallRingCircle" cx="60" cy="60" r="52" fill="none"
              stroke="${wColors[1]}" stroke-width="10" stroke-linecap="round"
              stroke-dasharray="${CIRC_BIG.toFixed(2)}"
              stroke-dashoffset="${CIRC_BIG.toFixed(2)}"
              style="transition:stroke-dashoffset 1.4s cubic-bezier(0.34,1.1,0.64,1);"/>
          </svg>
          <div style="position:absolute;text-align:center;">
            <div class="overall-big-pct" id="overallPctNum">0%</div>
            <div class="overall-sub">${isCurrent?'today':'monthly'}</div>
          </div>
        </div>
        <p class="overall-habits-label">${done} / ${total} habit-days</p>
        <p style="font-size:0.74rem;color:var(--text-muted);margin-top:3px;">${habits.length} habits tracked</p>
      </div>`;

    setTimeout(() => {
      const ring = document.getElementById('overallRingCircle');
      if (ring) ring.style.strokeDashoffset = (CIRC_BIG - (todayPct/100)*CIRC_BIG).toFixed(2);
      animateNumber(document.getElementById('overallPctNum'), todayPct, '%', 1000);
    }, 120);
  }

  /* ─── Leaderboard ─── */
  function renderLeaderboard() {
    const el = document.getElementById('leaderboardCard');
    if (!el) return;
    const top = D.getTopHabits(10);
    const wColors = getWeekColors();
    if (!top.length) {
      el.innerHTML = `<p class="card-title">🏆 Habit Leaders</p>
        <div class="empty-state"><div class="empty-state-icon">🌱</div>
        <p class="empty-state-text">No habits yet</p>
        <p class="empty-state-sub">Add habits to see your leaderboard</p></div>`;
      return;
    }
    const medal = i => i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1;
    const rankCls = i => i===0?'gold':i===1?'silver':i===2?'bronze':'';
    el.innerHTML = `
      <p class="card-title">🏆 Habit Leaders</p>
      <table class="leaderboard-table">
        <thead><tr><th>#</th><th></th><th>Habit</th><th colspan="2">Progress</th></tr></thead>
        <tbody>
          ${top.map((h,i) => `
            <tr>
              <td class="lb-rank ${rankCls(i)}">${medal(i)}</td>
              <td class="lb-icon">${h.icon||'📌'}</td>
              <td class="lb-name">${h.name}</td>
              <td style="width:80px;">
                <div class="lb-bar-wrap">
                  <div class="lb-bar" id="lbbar${i}"
                    style="width:0%;background:${wColors[i%5]};transition:width 0.8s cubic-bezier(0.34,1.4,0.64,1) ${i*80}ms;"
                    data-w="${h.pct}"></div>
                </div>
              </td>
              <td class="lb-pct" id="lbpct${i}">0%</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    // Animate bars and counters
    top.forEach((h,i) => {
      setTimeout(() => {
        const bar = document.getElementById(`lbbar${i}`);
        if (bar) bar.style.width = h.pct + '%';
        animateNumber(document.getElementById(`lbpct${i}`), h.pct, '%', 600);
      }, i * 60);
    });
  }

  /* ─── Main render ─── */
  function render() {
    renderQuoteCard();
    renderAffirmationCard();
    renderRoleSelector();
    renderAreaChart();
    renderWeeklyBars();
    renderWeeklyRings();
    renderOverallRing();
    renderLeaderboard();
  }

  return { render };
})();
