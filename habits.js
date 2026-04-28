window.COS = window.COS || {};

COS.Habits = (function () {
  const D = COS.Data;
  const ICONS = ['📚','🏋️','🥗','💧','🌿','💻','🧘','💰','📝','🎯','🚀','🌙','☀️','🎨','📖','🏃','🤝','📵','🔁','📩','📊','🎵','🌍','💤','🙏'];
  const CATEGORIES = ['Health', 'Learning', 'Work', 'Mindfulness', 'Finance', 'Social'];
  const FREQS = [
    { val: 'daily', label: 'Every day' },
    { val: 'weekdays', label: 'Weekdays only' },
  ];
  const WEEK_COLORS = ['#7EB8F7','#F9A8D4','#6EE7B7','#FDE68A','#C4B5FD'];
  const WEEK_BG = ['#EFF6FF','#FDF2F8','#ECFDF5','#FFFBEB','#F5F3FF'];
  const DOW_LETTERS = ['S','M','T','W','T','F','S'];
  let editingId = null;
  let selectedIcon = '📝';
  let viewMode = 'monthly'; // 'monthly' | 'weekly'
  let currentWeekOffset = 0;

  function getWeekColors() {
    const s = D.loadSettings();
    return s.weekColors || WEEK_COLORS;
  }

  function render() {
    renderGrid();
  }

  function renderGrid() {
    const wrapper = document.getElementById('habitGridWrapper');
    if (!wrapper) return;
    const habits = D.loadHabits();
    if (!habits.length) {
      wrapper.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <p class="empty-state-text">No habits yet</p>
        <p class="empty-state-sub">Click "+ Add Habit" to get started, or choose your role above to load defaults.</p>
      </div>`;
      return;
    }
    if (viewMode === 'monthly') renderMonthlyGrid(wrapper, habits);
    else renderWeeklyGrid(wrapper, habits);
  }

  function renderMonthlyGrid(wrapper, habits) {
    const days = D.getDaysInMonth(D.currentYear, D.currentMonth);
    const data = D.loadMonthData(D.currentYear, D.currentMonth);
    const wColors = getWeekColors();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === D.currentYear && today.getMonth() === D.currentMonth;
    const todayDate = isCurrentMonth ? today.getDate() : -1;

    // Build week groups
    const numWeeks = Math.ceil(days / 7);
    const weekGroups = [];
    for (let w = 0; w < numWeeks; w++) {
      const start = w * 7 + 1, end = Math.min(start + 6, days);
      weekGroups.push({ w, start, end, color: wColors[w], bg: WEEK_BG[w] });
    }

    let html = `<div style="overflow-x:auto;">
    <table class="habit-table">
      <thead>
        <tr>
          <th class="habit-col-sticky"><div class="habit-name-header">Habit</div></th>
          ${weekGroups.map(g => {
            const span = g.end - g.start + 1;
            return `<th colspan="${span}" style="border-bottom:2px solid ${g.color};background:${g.bg};padding:5px 4px 2px;text-align:center;font-size:0.65rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${g.color.replace('#','').length===6 ? '#555' : g.color}">W${g.w+1}</th>`;
          }).join('')}
          <th style="border-bottom:2px solid var(--border);padding:5px 8px;font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Streak</th>
        </tr>
        <tr>
          <th class="habit-col-sticky"><div class="habit-name-header" style="border-bottom:none;padding-top:4px;padding-bottom:8px;"></div></th>
          ${Array.from({length:days},(_,i)=>{
            const d = i+1;
            const dow = new Date(D.currentYear, D.currentMonth, d).getDay();
            const wIdx = D.getWeekIndex(d);
            const isToday = d === todayDate;
            return `<th class="day-header${isToday?' today':''}" style="color:${isToday?wColors[wIdx]:''};">${DOW_LETTERS[dow]}<br><span style="font-size:0.7rem;font-weight:${isToday?800:500};opacity:${isToday?1:0.7}">${d}</span></th>`;
          }).join('')}
          <th style="border-bottom:2px solid var(--border);"></th>
        </tr>
      </thead>
      <tbody id="habitTbody">
        ${habits.map((h, hIdx) => renderHabitRow(h, days, data, wColors, todayDate, hIdx)).join('')}
      </tbody>
    </table></div>`;
    wrapper.innerHTML = html;
    attachGridEvents(wrapper, habits, data);
  }

  function renderHabitRow(h, days, data, wColors, todayDate, hIdx) {
    const streak = D.getStreak(h.id);
    let streakClass = 'zero';
    if (streak >= 7) streakClass = 'fire';
    else if (streak >= 3) streakClass = 'hot';
    else if (streak >= 1) streakClass = '';

    const cells = Array.from({length:days},(_,i)=>{
      const d = i+1;
      const checked = D.isChecked(h.id, d, data);
      const wIdx = D.getWeekIndex(d);
      const color = wColors[wIdx];
      const isToday = d === todayDate;
      return `<td class="habit-cell" data-habit="${h.id}" data-day="${d}"
        style="${isToday?'background:rgba(126,184,247,0.06)':''}">
        <div class="habit-check${checked?' checked':''}" style="${checked?`background:${color};color:#fff;border-color:${color}`:''}">
          ${checked?'✓':''}
        </div>
      </td>`;
    }).join('');

    return `<tr class="habit-row" data-id="${h.id}" draggable="true">
      <td class="habit-col-sticky">
        <div class="habit-name-cell">
          <span class="drag-handle" title="Drag to reorder">⠿</span>
          <span class="habit-icon-cell">${h.icon||'📌'}</span>
          <span class="habit-name-text" title="${h.name}">${h.name}</span>
          <div class="habit-actions">
            <button class="habit-action-btn edit-habit-btn" data-id="${h.id}" title="Edit">✏️</button>
            <button class="habit-action-btn del-habit-btn" data-id="${h.id}" title="Delete">🗑️</button>
          </div>
        </div>
      </td>
      ${cells}
      <td class="streak-cell">
        <span class="streak-badge ${streakClass}">${streak > 0 ? (streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '🟡') : ''}${streak > 0 ? streak : '—'}</span>
      </td>
    </tr>`;
  }

  function renderWeeklyGrid(wrapper, habits) {
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === D.currentYear && today.getMonth() === D.currentMonth;
    const currentDayOfWeek = isCurrentMonth ? today.getDay() : 0;
    const todayDate = isCurrentMonth ? today.getDate() : -1;
    const days = D.getDaysInMonth(D.currentYear, D.currentMonth);

    // Determine the week to show
    const weekStart = currentWeekOffset * 7 + 1;
    const weekEnd = Math.min(weekStart + 6, days);
    if (weekStart > days) { currentWeekOffset = 0; renderWeeklyGrid(wrapper, habits); return; }

    const data = D.loadMonthData(D.currentYear, D.currentMonth);
    const wColors = getWeekColors();
    const wColor = wColors[currentWeekOffset % 5];

    let html = `<div class="week-nav-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:12px 16px;background:var(--surface);border-radius:var(--radius-lg);border:1.5px solid var(--border-light);">
      <button id="weekPrev" class="btn-secondary" style="padding:6px 14px;">← Prev</button>
      <span style="font-weight:700;color:${wColor};font-size:0.95rem;">Week ${currentWeekOffset+1} &nbsp;|&nbsp; Days ${weekStart}–${weekEnd}</span>
      <button id="weekNext" class="btn-secondary" style="padding:6px 14px;">Next →</button>
    </div>
    <div style="overflow-x:auto;border-radius:var(--radius-lg);border:1.5px solid var(--border-light);box-shadow:var(--shadow);">
    <table class="habit-table">
      <thead>
        <tr>
          <th class="habit-col-sticky"><div class="habit-name-header">Habit</div></th>
          ${Array.from({length:weekEnd-weekStart+1},(_,i)=>{
            const d = weekStart+i;
            const dow = new Date(D.currentYear, D.currentMonth, d).getDay();
            const isToday = d===todayDate;
            return `<th style="width:56px;min-width:56px;border-bottom:2px solid ${isToday?wColor:'var(--border)'};background:${isToday?'rgba(126,184,247,0.08)':''};padding:8px 4px;text-align:center;font-size:0.72rem;font-weight:${isToday?800:600};color:${isToday?wColor:'var(--text-muted)'};">
              ${DOW_LETTERS[dow]}<br><span style="font-size:0.8rem">${d}</span>
            </th>`;
          }).join('')}
          <th style="border-bottom:2px solid var(--border);padding:5px 8px;font-size:0.65rem;color:var(--text-muted);">Streak</th>
        </tr>
      </thead>
      <tbody>
        ${habits.map(h => {
          const streak = D.getStreak(h.id);
          let sc = streak>=7?'fire':streak>=3?'hot':streak>=1?'':'zero';
          return `<tr class="habit-row" data-id="${h.id}">
            <td class="habit-col-sticky">
              <div class="habit-name-cell">
                <span class="habit-icon-cell">${h.icon||'📌'}</span>
                <span class="habit-name-text">${h.name}</span>
              </div>
            </td>
            ${Array.from({length:weekEnd-weekStart+1},(_,i)=>{
              const d = weekStart+i;
              const checked = D.isChecked(h.id, d, data);
              const isToday = d===todayDate;
              return `<td class="habit-cell" data-habit="${h.id}" data-day="${d}" style="${isToday?'background:rgba(126,184,247,0.06)':''}">
                <div class="habit-check${checked?' checked':''}" style="width:32px;height:32px;border-radius:8px;${checked?`background:${wColor};color:#fff;border-color:${wColor}`:''}">
                  ${checked?'✓':''}
                </div>
              </td>`;
            }).join('')}
            <td class="streak-cell">
              <span class="streak-badge ${sc}">${streak>0?(streak>=7?'🔥':streak>=3?'⚡':'🟡'):''}${streak>0?streak:'—'}</span>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`;
    wrapper.innerHTML = html;
    attachGridEvents(wrapper, habits, data);
    document.getElementById('weekPrev').onclick = () => { if (currentWeekOffset > 0) { currentWeekOffset--; renderWeeklyGrid(wrapper, habits); } };
    document.getElementById('weekNext').onclick = () => {
      const days2 = D.getDaysInMonth(D.currentYear, D.currentMonth);
      if ((currentWeekOffset+1)*7+1 <= days2) { currentWeekOffset++; renderWeeklyGrid(wrapper, habits); }
    };
  }

  function attachGridEvents(wrapper, habits, data) {
    // Toggle cells
    wrapper.querySelectorAll('.habit-cell').forEach(td => {
      td.addEventListener('click', () => {
        const habitId = td.dataset.habit;
        const day = parseInt(td.dataset.day);
        const checked = D.toggleHabitDay(habitId, day);
        const box = td.querySelector('.habit-check');
        if (!box) return;
        const wIdx = D.getWeekIndex(day);
        const wColors = getWeekColors();
        const color = wColors[wIdx];
        if (checked) {
          box.classList.add('checked', 'pop');
          box.style.background = color;
          box.style.borderColor = color;
          box.style.color = '#fff';
          box.textContent = '✓';
          box.addEventListener('animationend', () => box.classList.remove('pop'), { once: true });
          const streak = D.getStreak(habitId);
          if (streak === 3) COS.App.toast('⚡ 3-day streak!', 'fire');
          if (streak === 7) COS.App.toast('🔥 7-day streak! You\'re on fire!', 'fire');
          if (streak === 30) COS.App.toast('🏆 30-day streak! Legendary!', 'fire');
        } else {
          box.classList.remove('checked');
          box.style.background = '';
          box.style.borderColor = '';
          box.style.color = '';
          box.textContent = '';
        }
        // Update streaks & dashboard
        setTimeout(() => {
          updateRowStreak(habitId);
          COS.Dashboard.render();
        }, 50);
      });
    });

    // Edit/delete
    wrapper.querySelectorAll('.edit-habit-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openModal(btn.dataset.id); });
    });
    wrapper.querySelectorAll('.del-habit-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('Delete this habit? All tracked data for it will be lost.')) {
          const habits2 = D.loadHabits().filter(h => h.id !== btn.dataset.id);
          D.saveHabits(habits2);
          COS.App.refresh();
          COS.App.toast('Habit deleted.', 'info');
        }
      });
    });

    // Drag-and-drop reorder
    let dragId = null;
    wrapper.querySelectorAll('.habit-row[draggable]').forEach(row => {
      row.addEventListener('dragstart', () => { dragId = row.dataset.id; row.style.opacity='0.5'; });
      row.addEventListener('dragend', () => { row.style.opacity=''; dragId=null; wrapper.querySelectorAll('.habit-row').forEach(r=>r.classList.remove('drag-over')); });
      row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('drag-over'); });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', e => {
        e.preventDefault();
        if (!dragId || dragId === row.dataset.id) return;
        const habits2 = D.loadHabits();
        const fromIdx = habits2.findIndex(h=>h.id===dragId);
        const toIdx = habits2.findIndex(h=>h.id===row.dataset.id);
        const [moved] = habits2.splice(fromIdx,1);
        habits2.splice(toIdx,0,moved);
        D.saveHabits(habits2);
        renderGrid();
      });
    });
  }

  function updateRowStreak(habitId) {
    const streak = D.getStreak(habitId);
    const row = document.querySelector(`.habit-row[data-id="${habitId}"]`);
    if (!row) return;
    const badge = row.querySelector('.streak-badge');
    if (!badge) return;
    let sc = streak>=7?'fire':streak>=3?'hot':streak>=1?'':'zero';
    badge.className = `streak-badge ${sc}`;
    badge.textContent = streak>0?(streak>=7?'🔥':streak>=3?'⚡':'🟡')+''+streak:'—';
  }

  function openModal(id) {
    editingId = id || null;
    const habits = D.loadHabits();
    const habit = id ? habits.find(h=>h.id===id) : null;
    selectedIcon = habit ? (habit.icon||'📝') : '📝';
    const modal = document.getElementById('habitModal');
    document.getElementById('modalTitle').textContent = id ? 'Edit Habit' : 'New Habit';
    document.getElementById('habitNameInput').value = habit ? habit.name : '';
    document.getElementById('habitCatSelect').value = habit ? (habit.category||'Health') : 'Health';
    document.getElementById('habitFreqSelect').value = habit ? (Array.isArray(habit.frequency)?'daily':habit.frequency||'daily') : 'daily';
    renderIconGrid();
    modal.showModal();
  }

  function renderIconGrid() {
    const grid = document.getElementById('iconGrid');
    if (!grid) return;
    grid.innerHTML = ICONS.map(ic => `<div class="icon-opt${ic===selectedIcon?' selected':''}" data-icon="${ic}">${ic}</div>`).join('');
    grid.querySelectorAll('.icon-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedIcon = opt.dataset.icon;
        grid.querySelectorAll('.icon-opt').forEach(o=>o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  }

  function saveModal() {
    const name = document.getElementById('habitNameInput').value.trim();
    if (!name) { document.getElementById('habitNameInput').style.borderColor='#EF4444'; return; }
    document.getElementById('habitNameInput').style.borderColor='';
    const cat = document.getElementById('habitCatSelect').value;
    const freq = document.getElementById('habitFreqSelect').value;
    const habits = D.loadHabits();
    if (editingId) {
      const idx = habits.findIndex(h=>h.id===editingId);
      if (idx>=0) { habits[idx] = {...habits[idx], name, icon:selectedIcon, category:cat, frequency:freq}; }
    } else {
      habits.push({ id:D.generateId(), name, icon:selectedIcon, category:cat, frequency:freq, createdAt:Date.now() });
    }
    D.saveHabits(habits);
    document.getElementById('habitModal').close();
    COS.App.refresh();
    COS.App.toast(editingId ? '✅ Habit updated!' : '✅ Habit added!', 'success');
  }

  function initModal() {
    const modal = document.getElementById('habitModal');
    document.getElementById('modalCancelBtn').onclick = () => modal.close();
    document.getElementById('modalSaveBtn').onclick = saveModal;
    modal.addEventListener('click', e => { if(e.target===modal) modal.close(); });
  }

  function setViewMode(mode) {
    viewMode = mode;
    if (mode === 'weekly') {
      const today = new Date();
      if (today.getFullYear()===D.currentYear && today.getMonth()===D.currentMonth) {
        currentWeekOffset = Math.floor((today.getDate()-1)/7);
      } else currentWeekOffset = 0;
    }
    renderGrid();
  }

  return { render, openModal, initModal, setViewMode };
})();
