window.COS = window.COS || {};

COS.Stats = (function () {
  const D = COS.Data;

  function getWeekColors() {
    const s = D.loadSettings();
    return s.weekColors || ['#7EB8F7','#F9A8D4','#6EE7B7','#FDE68A','#C4B5FD'];
  }

  function heatmapColor(pct, wColors) {
    if (pct === 0) return 'var(--surface-2)';
    if (pct < 30) return wColors[0] + '40';
    if (pct < 60) return wColors[0] + '80';
    if (pct < 90) return wColors[0] + 'BB';
    return wColors[0];
  }

  function renderHeatmap(habitId, days, data, wColors) {
    const today = new Date();
    const isCurrentMonth = today.getFullYear()===D.currentYear && today.getMonth()===D.currentMonth;
    const maxDay = isCurrentMonth ? today.getDate() : days;
    let html = '<div class="heatmap-row">';
    for (let d = 1; d <= days; d++) {
      const checked = D.isChecked(habitId, d, data);
      const future = d > maxDay;
      const pct = checked ? 100 : 0;
      const bg = future ? 'var(--border-light)' : (checked ? wColors[D.getWeekIndex(d)] : 'var(--surface-2)');
      html += `<div class="heatmap-cell" title="Day ${d}: ${checked?'✅ Done':'Not done'}"
        style="background:${bg};opacity:${future?0.3:1};border-radius:3px;"></div>`;
    }
    html += '</div>';
    return html;
  }

  function render() {
    const el = document.getElementById('statsView');
    if (!el) return;
    const habits = D.loadHabits();
    const wColors = getWeekColors();

    if (!habits.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div>
        <p class="empty-state-text">No habits to analyze yet</p>
        <p class="empty-state-sub">Add habits and start tracking to see your stats here.</p></div>`;
      return;
    }

    const days = D.getDaysInMonth(D.currentYear, D.currentMonth);
    const data = D.loadMonthData(D.currentYear, D.currentMonth);
    const monthly = D.getMonthlyCompletion();
    const today = new Date();
    const isCurrentMonth = today.getFullYear()===D.currentYear && today.getMonth()===D.currentMonth;

    // Best day
    let bestDay = 0, bestDayPct = 0;
    const maxDay = isCurrentMonth ? today.getDate() : days;
    for (let d = 1; d <= maxDay; d++) {
      const p = D.getDailyCompletion(d);
      if (p > bestDayPct) { bestDayPct = p; bestDay = d; }
    }

    // Best week
    let bestWeek = 0, bestWeekPct = 0;
    const numWeeks = Math.ceil(days/7);
    for (let w = 0; w < numWeeks; w++) {
      const p = D.getWeeklyCompletion(w);
      if (p > bestWeekPct) { bestWeekPct = p; bestWeek = w+1; }
    }

    // Best habit
    const topHabits = D.getTopHabits(1);
    const bestHabit = topHabits[0];

    el.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 style="font-family:var(--font-heading);font-size:1.6rem;margin-bottom:4px;">📊 Your Stats</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;">${new Date(D.currentYear,D.currentMonth,1).toLocaleString('default',{month:'long',year:'numeric'})}</p>
      </div>

      <!-- Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:28px;">
        ${[
          { icon:'🎯', label:'Monthly Completion', val: monthly.pct+'%', sub: `${monthly.done}/${monthly.total} checked` },
          { icon:'🏆', label:'Best Habit', val: bestHabit ? (bestHabit.icon+' '+bestHabit.pct+'%') : '—', sub: bestHabit ? bestHabit.name : 'No data yet' },
          { icon:'📅', label:'Best Day', val: bestDay ? `Day ${bestDay}` : '—', sub: bestDay ? `${bestDayPct}% complete` : 'No data yet' },
          { icon:'🗓️', label:'Best Week', val: bestWeek ? `Week ${bestWeek}` : '—', sub: bestWeek ? `${bestWeekPct}% complete` : 'No data yet' },
        ].map(c=>`
          <div class="card" style="text-align:center;padding:18px 14px;">
            <div style="font-size:1.6rem;margin-bottom:8px;">${c.icon}</div>
            <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">${c.label}</div>
            <div style="font-family:var(--font-heading);font-size:1.3rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;">${c.val}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${c.sub}</div>
          </div>`).join('')}
      </div>

      <!-- Per-habit cards -->
      <h3 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:16px;color:var(--text-primary);">Habit Breakdown</h3>
      <div class="stats-grid">
        ${habits.map((h, i) => {
          const { done, total, pct } = D.getHabitCompletion(h.id);
          const longest = D.getLongestStreak(h.id);
          const streak = D.getStreak(h.id);
          const color = wColors[i % wColors.length];
          return `
          <div class="stat-habit-card" style="border-left:4px solid ${color};">
            <div class="stat-habit-header">
              <span class="stat-habit-icon">${h.icon||'📌'}</span>
              <div>
                <div class="stat-habit-name">${h.name}</div>
                <div class="stat-habit-cat"><span class="cat-badge cat-${h.category||'Health'}">${h.category||'Health'}</span></div>
              </div>
            </div>
            <div style="height:6px;background:var(--surface-2);border-radius:99px;overflow:hidden;margin-bottom:14px;">
              <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width 1s ease;"></div>
            </div>
            <div class="stat-nums">
              <div class="stat-num-item"><div class="stat-num-val">${pct}%</div><div class="stat-num-label">Done</div></div>
              <div class="stat-num-item"><div class="stat-num-val">${done}/${total}</div><div class="stat-num-label">Days</div></div>
              <div class="stat-num-item"><div class="stat-num-val">${longest}</div><div class="stat-num-label">Best Streak</div></div>
            </div>
            ${renderHeatmap(h.id, days, data, wColors)}
          </div>`;
        }).join('')}
      </div>`;
  }

  return { render };
})();
